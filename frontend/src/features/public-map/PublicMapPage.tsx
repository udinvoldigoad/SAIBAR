import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "../../shared/api/client";
import { AppShell } from "../../shared/components/AppShell";
import { Icon } from "../../shared/components/Icon";
import { InlineNotice } from "../../shared/components/InlineNotice";
import { Skeleton } from "../../shared/components/Skeleton";
import { riskColors, riskLabels } from "../../shared/constants/risk";
import { getCurrentUser } from "../../shared/auth/session";
import { severityLabels, type ReportSeverity } from "../reports/reportData";
import "./publicMap.css";
import { applyMapboxBasemap, emissive, EXTRUSION_MIN_PITCH, INDONESIA_BOUNDS, labelFont, layerSlot, loadMapEngine, MAPBOX_STYLE, MAPLIBRE_STYLE, MIN_ZOOM, type MapEngine } from "./mapEngine";
import { formatMapDate, MapRegionPanel, MapRegionSheet } from "./MapRegionPanel";

type GeoJsonFeature = { type: "Feature"; id: string; geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> };
type FeatureCollection = { type: "FeatureCollection"; features: GeoJsonFeature[] };
type Prediction = { prediction_date: string; region?: { regency?: string | null } | null };
type MapLayers = {
  tidal_stations: FeatureCollection;
  coastlines: FeatureCollection;
  critical_infrastructure: FeatureCollection;
  evacuation_routes: FeatureCollection;
};
type ActiveWarning = { title: string; message: string; affected_regencies?: string[]; source?: string };
type DataFreshness = { last_generated_at: string | null; is_stale: boolean; notice: string | null };
type MapResponse = { data: { regions: FeatureCollection; reports: FeatureCollection; layers?: MapLayers; active_warning?: ActiveWarning | null; data_freshness?: DataFreshness } };
type PredictionResponse = { data: Prediction[] };
export type LayerKey = "bahaya_rob" | "laporan" | "pasang_surut" | "garis_pantai" | "infrastruktur_kritis" | "evakuasi";

const riskDotClass: Record<string, string> = { sangat_tinggi: "critical", tinggi: "high", sedang: "medium", rendah: "low" };

const regencyCoordinates: Record<string, { center: [number, number]; zoom: number }> = {
  "Kota Bandar Lampung": { center: [105.2660, -5.4496], zoom: 12 },
  "Kabupaten Lampung Selatan": { center: [105.5898, -5.7335], zoom: 11 },
  "Kabupaten Pesawaran": { center: [105.1500, -5.5000], zoom: 11 },
  "Kabupaten Tanggamus": { center: [104.7000, -5.4500], zoom: 11 },
  "Kabupaten Pesisir Barat": { center: [103.9500, -5.1800], zoom: 10 },
  "Kabupaten Lampung Timur": { center: [105.6800, -5.0500], zoom: 10 },
  "Kabupaten Tulang Bawang": { center: [105.8000, -4.4000], zoom: 10 },
  "Kabupaten Tulang Bawang Barat": { center: [105.0500, -4.4500], zoom: 10 },
  "Kabupaten Mesuji": { center: [105.4000, -4.0500], zoom: 10 },
  "Kabupaten Lampung Tengah": { center: [105.2500, -4.8500], zoom: 10 },
  "Kabupaten Lampung Utara": { center: [104.8500, -4.8000], zoom: 10 },
  "Kabupaten Way Kanan": { center: [104.5500, -4.5000], zoom: 10 },
  "Kabupaten Lampung Barat": { center: [104.2000, -5.0500], zoom: 10 },
  "Kabupaten Pringsewu": { center: [104.9800, -5.3500], zoom: 11 },
  "Kota Metro": { center: [105.3000, -5.1100], zoom: 12 },
};
const numberFormatter = new Intl.NumberFormat("id-ID");

function riskText(value: unknown) {
  return riskLabels[String(value)] ?? String(value ?? "Belum ada data");
}

/** Saring nilai sebelum disuntikkan ke HTML popup peta (anti-XSS). */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function daysFromToday(dateStr: string): number {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function horizonLabel(dateStr: string): string {
  const diff = daysFromToday(dateStr);
  if (Number.isNaN(diff)) return dateStr;
  if (diff === 0) return "Hari ini";
  if (diff > 0) return `+${diff} hari`;
  return `${Math.abs(diff)} hari lalu`;
}

// Horizon prediksi sesuai SKPL: hari ini, +1, +2, +3, +7.
const HORIZON_OPTIONS: { label: string; offset: number }[] = [
  { label: "Hari ini", offset: 0 },
  { label: "+1 hari", offset: 1 },
  { label: "+2 hari", offset: 2 },
  { label: "+3 hari", offset: 3 },
  { label: "+7 hari", offset: 7 },
];

function dateFromOffset(offset: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function featureCenter(feature: GeoJsonFeature): [number, number] | null {
  const points: [number, number][] = [];
  const collect = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      points.push([value[0], value[1]]);
      return;
    }
    value.forEach(collect);
  };
  collect(feature.geometry.coordinates);
  if (!points.length) return null;
  const [minLon, maxLon] = [Math.min(...points.map(([lon]) => lon)), Math.max(...points.map(([lon]) => lon))];
  const [minLat, maxLat] = [Math.min(...points.map(([, lat]) => lat)), Math.max(...points.map(([, lat]) => lat))];
  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

function zoneRadiusKm(risk: unknown) {
  // Disesuaikan dengan contoh: sangat tinggi 800m, tinggi 600m, sedang 400m
  return ({ sangat_tinggi: 0.8, tinggi: 0.6, sedang: 0.4, rendah: 0.2 } as Record<string, number>)[String(risk)] ?? 0.2;
}

function geographicCircle(center: [number, number], radiusKm: number): { type: "Polygon"; coordinates: number[][][] } {
  const [longitude, latitude] = center;
  const earthRadiusKm = 6371;
  const latitudeRadians = latitude * Math.PI / 180;
  const longitudeRadians = longitude * Math.PI / 180;
  const distance = radiusKm / earthRadiusKm;
  const ring = Array.from({ length: 49 }, (_, index) => {
    const bearing = (index * 7.5) * Math.PI / 180;
    const pointLat = Math.asin(Math.sin(latitudeRadians) * Math.cos(distance) + Math.cos(latitudeRadians) * Math.sin(distance) * Math.cos(bearing));
    const pointLon = longitudeRadians + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(latitudeRadians), Math.cos(distance) - Math.sin(latitudeRadians) * Math.sin(pointLat));
    return [pointLon * 180 / Math.PI, pointLat * 180 / Math.PI];
  });
  return { type: "Polygon", coordinates: [ring] };
}

// Ambang peralihan tampilan: di bawah zoom ini ratusan kelurahan digabung jadi
// gelembung cluster; pada/di atasnya kembali ke badge angka per wilayah.
const CLUSTER_MAX_ZOOM = 10;
// Peringkat untuk menentukan risiko TERTINGGI dalam satu cluster (agregasi
// dilakukan MapLibre lewat clusterProperties).
const RISK_RANK: Record<string, number> = { rendah: 1, sedang: 2, tinggi: 3, sangat_tinggi: 4 };

// Dropdown custom (bukan <select> native) agar tampilannya konsisten dengan
// tombol layer dan rapi lintas OS — popup <select> native tak bisa distyle.
function FilterSelect({ icon, ariaLabel, value, options, onChange }: {
  icon: string;
  ariaLabel: string;
  value: string;
  // `short` opsional: teks ringkas untuk tombol (mis. "Semua") saat label
  // penuhnya panjang; daftar dropdown tetap memakai `label`.
  options: { value: string; label: string; short?: string }[];
  onChange: (value: string) => void;
}) {
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const selected = options.find((option) => option.value === value);
  return (
    <div ref={ref} className="filter-select" style={{ position: "relative", minWidth: 0 }}>
      <button
        type="button"
        className="layer-menu-btn"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, padding: "0 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", cursor: "pointer", fontSize: 14, fontWeight: 500, width: "100%", textAlign: "left" }}
      >
        <Icon name={icon} style={{ fontSize: 18, color: "var(--accent)" }} />
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected?.short ?? selected?.label ?? ""}</span>
        <Icon name="expand_more" style={{ fontSize: 18, color: "var(--ink-soft)", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && (
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : .15 }}
          className="filter-select-dropdown"
          role="listbox"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              data-value={option.value}
              className="filter-option"
              onClick={() => { onChange(option.value); setOpen(false); }}
            >
              {option.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function RiskMap({ regions, reports, layers, activeLayers, selectedRegency, userLocation, onSelectFeature }: { regions: FeatureCollection; reports: FeatureCollection; layers: MapLayers; activeLayers: Record<LayerKey, boolean>; selectedRegency: string; userLocation: [number, number] | null; onSelectFeature: (feature: GeoJsonFeature) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  // Mesin peta aktif (Mapbox bila ada token, selain itu MapLibre). Dimuat
  // async, jadi `mapReady` dipakai memicu ulang efek setelah peta tercipta.
  const engineRef = useRef<MapEngine | null>(null);
  const [mapReady, setMapReady] = useState(0);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const reportMarkers = useRef<maplibregl.Marker[]>([]);
  const predictionMarkers = useRef<maplibregl.Marker[]>([]);
  const tidalMarkers = useRef<maplibregl.Marker[]>([]);
  const infraMarkers = useRef<maplibregl.Marker[]>([]);
  const evacMarkers = useRef<maplibregl.Marker[]>([]);
  const onSelectFeatureRef = useRef(onSelectFeature);
  onSelectFeatureRef.current = onSelectFeature;
  // Dipakai handler klik cluster yang hanya didaftarkan sekali, sehingga tidak
  // boleh menutup (closure) nilai `regions` dari render pertama.
  const regionsRef = useRef(regions);
  regionsRef.current = regions;
  const clusterHandlersBound = useRef(false);
  // Animasi denyut halo wilayah Tinggi/Sangat Tinggi (requestAnimationFrame).
  const pulseFrame = useRef(0);
  // Ditandai true saat peta selesai `load`. Dipakai sebagai gerbang update yang
  // andal (lihat catatan di efek update di bawah).
  const mapLoaded = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let themeObserver: MutationObserver | null = null;
    let resizeFrame = 0;

    void loadMapEngine().then((engine) => {
      // Komponen sudah unmount (atau StrictMode membersihkan efek pertama)
      // sebelum modul Mapbox selesai dimuat → jangan buat peta; tiap `new Map`
      // di Mapbox dihitung satu map load.
      if (cancelled || !mapContainer.current || map.current) return;
      engineRef.current = engine;
      const { gl, kind } = engine;
      const instance = new gl.Map({
        container: mapContainer.current,
        center: [105.26, -5.48],
        zoom: 9,
        minZoom: MIN_ZOOM,
        maxBounds: INDONESIA_BOUNDS,
        style: kind === "mapbox" ? MAPBOX_STYLE : MAPLIBRE_STYLE,
      });
      map.current = instance;
      instance.addControl(new gl.NavigationControl({ visualizePitch: true }), "top-right");
      instance.addControl(new gl.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-right");
      instance.on("style.load", () => applyMapboxBasemap(instance, kind));
      instance.on("load", () => { mapLoaded.current = true; });

      // Tema aplikasi berubah → ganti preset siang/malam basemap TANPA membuat
      // ulang peta (membuat ulang = map load baru yang ditagih).
      if (kind === "mapbox") {
        themeObserver = new MutationObserver(() => applyMapboxBasemap(instance, kind));
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      }

      observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => map.current?.resize());
      });
      observer.observe(mapContainer.current);
      setMapReady((n) => n + 1);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      themeObserver?.disconnect();
      cancelAnimationFrame(resizeFrame);
      map.current?.remove();
      map.current = null;
      mapLoaded.current = false;
      clusterHandlersBound.current = false;
      cancelAnimationFrame(pulseFrame.current);
      pulseFrame.current = 0;
    };
  }, []);

  // Penanda "Anda di sini" pada koordinat asli pengguna + terbang ke titik itu.
  // Terpisah dari efek update agar flyTo ke lokasi persis tidak ditimpa fitBounds.
  useEffect(() => {
    const instance = map.current;
    if (!instance || !userLocation) return;
    const gl = engineRef.current?.gl ?? maplibregl;
    const showUser = () => {
      userMarker.current?.remove();
      const element = document.createElement("div");
      element.className = "user-location-marker";
      element.setAttribute("aria-label", "Lokasi Anda");
      element.title = "Lokasi Anda";
      userMarker.current = new gl.Marker({ element }).setLngLat(userLocation).addTo(instance);
      instance.flyTo({ center: userLocation, zoom: 14, duration: 1200 });
    };
    if (mapLoaded.current) showUser(); else instance.once("load", showUser);
    return () => { instance.off("load", showUser); };
  }, [userLocation, mapReady]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const gl = engineRef.current?.gl ?? maplibregl;
    const engineKind = engineRef.current?.kind ?? "maplibre";
    const update = (shouldFrame = true) => {
      predictionMarkers.current.forEach(m => m.remove());
      predictionMarkers.current = [];
      reportMarkers.current.forEach(m => m.remove());
      reportMarkers.current = [];
      tidalMarkers.current.forEach(m => m.remove());
      tidalMarkers.current = [];
      infraMarkers.current.forEach(m => m.remove());
      infraMarkers.current = [];
      evacMarkers.current.forEach(m => m.remove());
      evacMarkers.current = [];

      const circleFeatures: GeoJSON.Feature[] = [];
      const riskPointFeatures: GeoJSON.Feature[] = [];
      // Batas wilayah asli tiap kelurahan (Polygon/MultiPolygon dari API) —
      // diwarnai sesuai kelas risiko & diangkat jadi kolom 3D saat peta miring.
      const regionPolygonFeatures: GeoJSON.Feature[] = [];
      // Di zoom jauh badge angka diwakili gelembung cluster; pada zoom dekat
      // badge dikembalikan, dan hanya dibuat untuk wilayah yang benar-benar
      // terlihat (viewport culling) agar jumlah node DOM tetap kecil.
      const showBadges = instance.getZoom() >= CLUSTER_MAX_ZOOM;
      const viewBounds = instance.getBounds();

      // 1. TAMBAH TITIK BANJIR (PREDIKSI)
      if (activeLayers.bahaya_rob) {
        regions.features.forEach((feature) => {
        const center = featureCenter(feature);
        if (!center) return;

        const risk = String(feature.properties.risk_class);
        const color = riskColors[risk] ?? riskColors.rendah;
        const rank = RISK_RANK[risk] ?? 1;
        const probability = Number(feature.properties.risk_probability) || 0;

        // A. Area kelurahan (batas asli). Wilayah tanpa polygon jatuh ke
        // lingkaran perkiraan seperti dulu agar tetap terlihat.
        const geometryType = feature.geometry.type;
        if (geometryType === "Polygon" || geometryType === "MultiPolygon") {
          regionPolygonFeatures.push({
            type: "Feature",
            geometry: feature.geometry as unknown as GeoJSON.Polygon | GeoJSON.MultiPolygon,
            properties: { color, riskRank: rank, probability, regionId: String(feature.id ?? "") },
          });
        } else {
          circleFeatures.push({
            type: "Feature",
            geometry: geographicCircle(center, zoneRadiusKm(risk)),
            properties: { color, risk_class: risk },
          });
        }

        // Titik untuk sumber ber-cluster (agregasi ditangani MapLibre).
        riskPointFeatures.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: center },
          properties: { 
            regionId: String(feature.id ?? ""), 
            color, 
            riskRank: rank,
            probability,
          },
        });

        // Badge angka hanya untuk Sedang ke atas: wilayah Rendah sudah cukup
        // diwakili warna polygonnya, dan ratusan badge "0" cuma bikin ramai.
        if (rank < 2 || !showBadges || !viewBounds.contains(center)) return;

        // B. Badge titik, klik untuk memilih wilayah di panel samping.
        // <button> asli, bukan div ber-role=button: dulu badge ini bisa
        // di-fokus lewat Tab tapi Enter/Space tidak melakukan apa pun karena
        // hanya listener click yang terpasang. Tombol native memberi aktivasi
        // keyboard & semantik fokus tanpa handler tambahan.
        const el = document.createElement("button");
        el.type = "button";
        el.className = "map-risk-badge";
        el.style.color = color;
        el.textContent = String(Math.round(Number(feature.properties.risk_probability ?? 0)));
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectFeatureRef.current(feature);
        });

        const marker = new gl.Marker({ element: el }).setLngLat(center).addTo(instance);

        // WAJIB setelah addTo(): maplibre menimpa aria-label elemen dengan
        // "Map marker" di dalam addTo(), sehingga label deskriptif yang
        // dipasang sebelumnya hilang dan semua badge terbaca sama oleh
        // pembaca layar.
        el.setAttribute(
          "aria-label",
          `${feature.properties.village ?? "Wilayah pesisir"}: risiko ${riskText(risk)}`,
        );

        predictionMarkers.current.push(marker);
      });
      }

      // 2. TAMBAH TITIK LAPORAN (GROUND TRUTH)
      if (activeLayers.laporan) {
        reports.features.forEach((report) => {
          const coordinates = report.geometry.coordinates;
          if (!Array.isArray(coordinates) || typeof coordinates[0] !== "number") return;
          const severity = String(report.properties.severity);
          const color = severity === "sangat_parah" ? riskColors.sangat_tinggi : severity === "parah" ? riskColors.tinggi : severity === "sedang" ? riskColors.sedang : riskColors.rendah;

          // Radius area untuk laporan sedikit lebih kecil
          const radiusKm = severity === "sangat_parah" ? 0.6 : severity === "parah" ? 0.4 : severity === "sedang" ? 0.2 : 0.1;
          circleFeatures.push({
            type: "Feature",
            geometry: geographicCircle([coordinates[0], coordinates[1]], radiusKm),
            properties: { color, risk_class: severity }
          });

          const incidentDate = report.properties.incident_time
            ? new Date(String(report.properties.incident_time)).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }) + " WIB"
            : null;
          // severity memakai kamus keparahan laporan (ringan/sedang/parah/
          // sangat_parah) — bukan kamus kelas risiko; radius lingkaran hanya
          // visualisasi keparahan, bukan hasil pengukuran.
          const popup = new gl.Popup({ offset: 25 }).setHTML(`<strong>Laporan: ${escapeHtml(report.properties.report_code ?? "Warga")}</strong><br>${escapeHtml(report.properties.location ?? "Wilayah pesisir")}${incidentDate ? `<br>Waktu kejadian: ${escapeHtml(incidentDate)}` : ""}<br>Tingkat Genangan: <span style="color:${color}; font-weight:bold;">${escapeHtml(severityLabels[severity as ReportSeverity] ?? severity)}</span><br>Ketinggian air: ${escapeHtml(report.properties.water_height_cm ?? "-")} cm`);

          reportMarkers.current.push(
            new gl.Marker({ color })
              .setLngLat([coordinates[0], coordinates[1]])
              .setPopup(popup)
              .addTo(instance)
          );
        });
      }

      if (activeLayers.pasang_surut) {
        layers.tidal_stations.features.forEach((station) => {
          const coordinates = station.geometry.coordinates;
          if (!Array.isArray(coordinates) || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") return;
          const popup = new gl.Popup({ offset: 20 }).setHTML(`<strong>Stasiun pasang surut</strong><br>${escapeHtml(station.properties.name ?? station.properties.code ?? "-")}<br>Sumber: ${escapeHtml(station.properties.source ?? "-")}`);
          tidalMarkers.current.push(
            new gl.Marker({ color: "#0284c7" })
              .setLngLat([coordinates[0], coordinates[1]])
              .setPopup(popup)
              .addTo(instance)
          );
        });
      }

      if (activeLayers.infrastruktur_kritis) {
        layers.critical_infrastructure.features.forEach((infra) => {
          const coordinates = infra.geometry.coordinates;
          if (!Array.isArray(coordinates) || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") return;
          const popup = new gl.Popup({ offset: 20 }).setHTML(`<strong>Infrastruktur Kritis</strong><br>${escapeHtml(infra.properties.name ?? "-")}<br>Tipe: ${escapeHtml(infra.properties.type ?? "-")}`);
          infraMarkers.current.push(
            new gl.Marker({ color: "#9333ea" })
              .setLngLat([coordinates[0], coordinates[1]])
              .setPopup(popup)
              .addTo(instance)
          );
        });
      }

      if (activeLayers.evakuasi) {
        layers.evacuation_routes.features.forEach((route) => {
          const coordinates = route.geometry.coordinates;
          if (!Array.isArray(coordinates) || typeof coordinates[0] !== "number" || typeof coordinates[1] !== "number") return;
          const popup = new gl.Popup({ offset: 20 }).setHTML(`<strong>Rute Evakuasi</strong><br>${escapeHtml(route.properties.name ?? "-")}`);
          evacMarkers.current.push(
            new gl.Marker({ color: "#16a34a" })
              .setLngLat([coordinates[0], coordinates[1]])
              .setPopup(popup)
              .addTo(instance)
          );
        });
      }

      const coastlineSourceId = "coastline-layer";
      // `GeoJsonFeature` di atas sengaja longgar (`coordinates: unknown`) karena
      // satu koleksi bisa memuat Point/LineString/Polygon sekaligus. MapLibre
      // menuntut tipe GeoJSON yang ketat, jadi penyempitannya dikerjakan di SATU
      // titik ini — lewat `unknown`, bukan `any`, sehingga variabel hasilnya
      // tetap terketik penuh dan salah pakai di bawah tetap ketahuan tsc.
      const coastlineData = (
        activeLayers.garis_pantai ? layers.coastlines : { type: "FeatureCollection", features: [] }
      ) as unknown as GeoJSON.FeatureCollection;
      const coastlineSource = instance.getSource(coastlineSourceId);
      if (coastlineSource) {
        (coastlineSource as maplibregl.GeoJSONSource).setData(coastlineData);
      } else {
        instance.addSource(coastlineSourceId, { type: "geojson", data: coastlineData });
        instance.addLayer({
          id: "coastline-layer-line",
          type: "line",
          source: coastlineSourceId,
          ...layerSlot(engineKind, "middle"),
          paint: { "line-color": "#0369a1", "line-width": 2, "line-opacity": 0.75, ...emissive(engineKind, "line") },
        });
      }

      // Polygon kelurahan: isi tipis + garis tepi (datar) dan kolom 3D yang
      // tingginya mengikuti peluang rob (hanya tampil saat peta dimiringkan).
      const regionSourceId = "risk-regions";
      const regionData: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: regionPolygonFeatures };
      const regionSource = instance.getSource(regionSourceId);
      if (regionSource) {
        (regionSource as maplibregl.GeoJSONSource).setData(regionData);
      } else {
        instance.addSource(regionSourceId, { type: "geojson", data: regionData });
        instance.addLayer({
          id: "risk-regions-fill",
          type: "fill",
          source: regionSourceId,
          ...layerSlot(engineKind, "middle"),
          paint: {
            "fill-color": ["get", "color"],
            // Tipis di zoom provinsi, lebih tegas saat diperbesar.
            "fill-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.12, 11, 0.32],
            ...emissive(engineKind, "fill"),
          },
        });
        instance.addLayer({
          id: "risk-regions-line",
          type: "line",
          source: regionSourceId,
          minzoom: 8,
          ...layerSlot(engineKind, "middle"),
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 12, 1.6],
            "line-opacity": 0.8,
            ...emissive(engineKind, "line"),
          },
        });
        instance.addLayer({
          id: "risk-regions-3d",
          type: "fill-extrusion",
          source: regionSourceId,
          layout: { visibility: "none" },
          ...layerSlot(engineKind, "middle"),
          paint: {
            "fill-extrusion-color": ["get", "color"],
            // 1% peluang = 60 m; minimal 80 m agar wilayah aman tetap tampak.
            "fill-extrusion-height": ["max", 80, ["*", ["get", "probability"], 60]],
            "fill-extrusion-base": 0,
            // Cukup transparan agar jalan & label di bawahnya tetap terbaca.
            "fill-extrusion-opacity": 0.6,
            "fill-extrusion-vertical-gradient": true,
            ...emissive(engineKind, "fill-extrusion"),
          },
        });
      }

      // Update Sumber GeoJSON untuk Area Lingkaran
      const circleSourceId = "risk-circles";
      const existingSource = instance.getSource(circleSourceId);
      if (existingSource) {
        (existingSource as maplibregl.GeoJSONSource).setData({
          type: "FeatureCollection",
          features: circleFeatures,
        });
      } else {
        instance.addSource(circleSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: circleFeatures,
          },
        });
        // minzoom: area zona baru digambar saat sudah cukup dekat. Di zoom jauh
        // ratusan lingkaran ini saling tindih dan justru membuat peta berantakan.
        instance.addLayer({
          id: "risk-circles-fill",
          type: "fill",
          source: circleSourceId,
          ...layerSlot(engineKind, "middle"),
          minzoom: CLUSTER_MAX_ZOOM,
          paint: {
            "fill-color": ["get", "color"],
            "fill-opacity": 0.4,
            ...emissive(engineKind, "fill"),
          },
        });
        instance.addLayer({
          id: "risk-circles-line",
          type: "line",
          source: circleSourceId,
          ...layerSlot(engineKind, "middle"),
          minzoom: CLUSTER_MAX_ZOOM,
          paint: {
            "line-color": ["get", "color"],
            "line-width": 2,
            ...emissive(engineKind, "line"),
          },
        });
      }

      // Sumber titik risiko dengan clustering bawaan MapLibre. Ukuran gelembung
      // = banyaknya wilayah di dalamnya, warna = risiko TERTINGGI di dalamnya
      // (bukan rata-rata, supaya area berbahaya tidak tersamarkan tetangganya).
      // Label persen digambar layer `symbol` (risk-cluster-labels) memakai glyph
      // yang di-host sendiri (lihat `glyphs` di atas).
      const pointSourceId = "risk-points";
      const pointData: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: riskPointFeatures };
      const pointSource = instance.getSource(pointSourceId);
      if (pointSource) {
        (pointSource as maplibregl.GeoJSONSource).setData(pointData);
      } else {
        instance.addSource(pointSourceId, {
          type: "geojson",
          data: pointData,
          cluster: true,
          clusterRadius: 48,
          clusterMaxZoom: CLUSTER_MAX_ZOOM,
          clusterProperties: { 
            maxRank: ["max", ["get", "riskRank"]],
            sumProb: ["+", ["get", "probability"]],
            maxProb: ["max", ["get", "probability"]]
          },
        });
        instance.addLayer({
          id: "risk-pulse",
          ...layerSlot(engineKind, "top"),
          type: "circle",
          source: pointSourceId,
          maxzoom: CLUSTER_MAX_ZOOM,
          filter: [
            "any", /* any-ok: operator ekspresi filter peta, bukan tipe TS */
            ["all", ["has", "point_count"], [">=", ["get", "maxRank"], 3]],
            ["all", ["!", ["has", "point_count"]], [">=", ["get", "riskRank"], 3]],
          ],
          paint: {
            "circle-color": [
              "case",
              [">=", ["coalesce", ["get", "maxRank"], ["get", "riskRank"]], 4], riskColors.sangat_tinggi,
              riskColors.tinggi,
            ],
            "circle-radius": 18,
            "circle-opacity": 0.3,
            "circle-blur": 0.6,
            ...emissive(engineKind, "circle"),
          },
        });
        instance.addLayer({
          id: "risk-clusters",
          ...layerSlot(engineKind, "top"),
          type: "circle",
          source: pointSourceId,
          filter: ["has", "point_count"],
          maxzoom: CLUSTER_MAX_ZOOM,
          paint: {
            "circle-color": [
              "case",
              [">=", ["get", "maxRank"], 4], riskColors.sangat_tinggi,
              [">=", ["get", "maxRank"], 3], riskColors.tinggi,
              [">=", ["get", "maxRank"], 2], riskColors.sedang,
              riskColors.rendah,
            ],
            // Cluster yang seluruhnya Rendah cukup titik kecil; Sedang ke atas
            // jadi gelembung yang ukurannya mengikuti jumlah wilayah.
            "circle-radius": [
              "case",
              ["<", ["get", "maxRank"], 2], 6,
              ["step", ["get", "point_count"], 15, 5, 19, 15, 25, 40, 31],
            ],
            "circle-opacity": ["case", ["<", ["get", "maxRank"], 2], 0.75, 0.92],
            "circle-stroke-width": ["case", ["<", ["get", "maxRank"], 2], 1.5, 3],
            "circle-stroke-color": "#fff",
            ...emissive(engineKind, "circle"),
          },
        });
        instance.addLayer({
          id: "risk-cluster-labels",
          ...layerSlot(engineKind, "top"),
          type: "symbol",
          source: pointSourceId,
          filter: ["all", ["has", "point_count"], [">=", ["get", "maxRank"], 2]],
          maxzoom: CLUSTER_MAX_ZOOM,
          layout: {
            "text-field": [
              "concat",
              ["to-string", ["round", ["get", "maxProb"]]],
              "%"
            ],
            "text-font": labelFont(engineKind),
            "text-size": 12,
            "text-allow-overlap": true
          },
          paint: {
            "text-color": "#ffffff",
            ...emissive(engineKind, "text"),
          }
        });
        instance.addLayer({
          id: "risk-unclustered",
          ...layerSlot(engineKind, "top"),
          type: "circle",
          source: pointSourceId,
          filter: ["!", ["has", "point_count"]],
          maxzoom: CLUSTER_MAX_ZOOM,
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": ["match", ["get", "riskRank"], 1, 4.5, 2, 6.5, 8],
            "circle-stroke-width": ["match", ["get", "riskRank"], 1, 1.2, 2],
            "circle-stroke-color": "#fff",
            ...emissive(engineKind, "circle"),
          },
        });
      }

      // Handler klik didaftarkan sekali saja agar tidak menumpuk tiap update.
      if (!clusterHandlersBound.current) {
        clusterHandlersBound.current = true;
        instance.on("click", "risk-clusters", (event) => {
          const feature = event.features?.[0];
          // Layer cluster selalu menghasilkan Point; penyempitan ini membuat
          // `coordinates` terbaca tanpa cast, sekaligus jadi penjaga bila
          // sumbernya suatu saat berubah.
          if (!feature || feature.geometry.type !== "Point") return;
          // Zoom bertahap agar cluster memecah — lebih tahan versi API daripada
          // getClusterExpansionZoom yang bentuknya berbeda antar rilis MapLibre.
          instance.easeTo({
            center: [feature.geometry.coordinates[0], feature.geometry.coordinates[1]],
            zoom: Math.min(instance.getZoom() + 2, CLUSTER_MAX_ZOOM + 2),
          });
        });
        instance.on("click", "risk-unclustered", (event) => {
          const regionId = event.features?.[0]?.properties?.regionId;
          if (!regionId) return;
          const region = regionsRef.current.features.find((item) => String(item.id) === String(regionId));
          if (region) onSelectFeatureRef.current(region);
        });
        instance.on("click", "risk-regions-fill", (event) => {
          const regionId = event.features?.[0]?.properties?.regionId;
          if (!regionId) return;
          const region = regionsRef.current.features.find((item) => String(item.id) === String(regionId));
          if (region) onSelectFeatureRef.current(region);
        });
        const sync3d = () => {
          if (!instance.getLayer("risk-regions-3d")) return;
          instance.setLayoutProperty("risk-regions-3d", "visibility", instance.getPitch() > EXTRUSION_MIN_PITCH ? "visible" : "none");
        };
        instance.on("pitch", sync3d);
        sync3d();

        // Denyut halo: radius & opasitas bergelombang ~1,6 detik per siklus.
        // Dilewati bila pengguna mematikan animasi di sistem operasi.
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const animate = (time: number) => {
            if (!map.current || !instance.getLayer("risk-pulse")) return;
            const phase = (time % 1600) / 1600;
            instance.setPaintProperty("risk-pulse", "circle-radius", 14 + phase * 16);
            instance.setPaintProperty("risk-pulse", "circle-opacity", 0.38 * (1 - phase));
            pulseFrame.current = requestAnimationFrame(animate);
          };
          pulseFrame.current = requestAnimationFrame(animate);
        }

        (["risk-clusters", "risk-unclustered", "risk-regions-fill"] as const).forEach((layerId) => {
          instance.on("mouseenter", layerId, () => { instance.getCanvas().style.cursor = "pointer"; });
          instance.on("mouseleave", layerId, () => { instance.getCanvas().style.cursor = ""; });
        });
      }

      // Saat dipicu pan/zoom, berhenti di sini: menjalankan framing di bawah
      // akan memindahkan peta lagi → memicu moveend lagi → loop tak berujung.
      if (!shouldFrame) return;

      // Kontainer peta berubah tinggi antar breakpoint (46vh di mobile). Tanpa
      // resize(), MapLibre memakai ukuran lama sehingga fitBounds meleset.
      instance.resize();

      // 3. FRAMING PETA
      // Selalu paskan viewport ke sebaran zona yang benar-benar ada. Backend
      // sudah memfilter fitur ke kabupaten terpilih, jadi fitBounds menjamin
      // seluruh kelurahan masuk layar — termasuk kabupaten yang lebar seperti
      // Bandar Lampung yang sebelumnya terpotong karena flyTo ke titik tetap.
      let bounds: maplibregl.LngLatBounds | null = null;
      let pointsCount = 0;
      regions.features.forEach((f) => {
        const center = featureCenter(f);
        if (center) {
          pointsCount++;
          if (!bounds) bounds = new gl.LngLatBounds(center, center);
          else bounds.extend(center);
        }
      });
      const activeBounds = bounds as maplibregl.LngLatBounds | null;
      if (activeBounds) {
        if (pointsCount === 1) {
          const sw = activeBounds.getSouthWest();
          activeBounds.extend([sw.lng - 0.05, sw.lat - 0.05]);
          activeBounds.extend([sw.lng + 0.05, sw.lat + 0.05]);
        }
        instance.fitBounds(activeBounds, { padding: 60, maxZoom: 13, duration: 1000 });
      } else if (selectedRegency && selectedRegency !== "all") {
        // Kabupaten terpilih tapi belum ada prediksi pada tanggal ini: arahkan
        // ke perkiraan pusat wilayah agar pengguna tetap paham konteks lokasi.
        const config = regencyCoordinates[selectedRegency] || regencyCoordinates[`Kabupaten ${selectedRegency}`] || regencyCoordinates[`Kota ${selectedRegency}`];
        if (config) instance.flyTo({ center: config.center, zoom: config.zoom, duration: 1000 });
        else instance.flyTo({ center: [105.26, -5.48], zoom: 9, duration: 1000 });
      } else {
        instance.flyTo({ center: [105.26, -5.48], zoom: 9, duration: 1000 });
      }
    };
    // Gerbang update memakai flag `mapLoaded` (di-set pada event `load`), bukan
    // isStyleLoaded()/idle. Sejak ada layer symbol + glyphs eksternal untuk
    // label "%", isStyleLoaded() bisa lama bernilai false dan `idle` tak kunjung
    // fire di koneksi lambat — akibatnya saat data wilayah tiba, update tak
    // pernah jalan dan zona tidak muncul ketika peta baru dibuka (baru muncul
    // setelah digeser/zoom yang memicu moveend). `load` fire andal setelah
    // basemap siap, tanpa menunggu unduhan glyphs.
    const onLoad = () => update();
    if (mapLoaded.current) update(); else instance.once("load", onLoad);

    // Badge dibuat per-viewport & bergantung zoom, jadi perlu digambar ulang
    // setiap peta selesai digeser/di-zoom — tanpa framing ulang.
    const handleMoveEnd = () => update(false);
    instance.on("moveend", handleMoveEnd);
    return () => { instance.off("moveend", handleMoveEnd); instance.off("load", onLoad); };
  }, [regions, reports, layers, activeLayers, selectedRegency, mapReady]);

  return <div ref={mapContainer} className="map-canvas" style={{ minHeight: 560, width: "100%" }} aria-label="Peta interaktif risiko banjir rob" />;
}

export function PublicMapPage() {
  const userRole = getCurrentUser()?.role ?? "";
  const reducedMotion = useReducedMotion();
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 1080px)").matches);
  const [detailOpen, setDetailOpen] = useState(false);
  const closeDetails = useCallback(() => setDetailOpen(false), []);
  const [reloadVersion, setReloadVersion] = useState(0);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1080px)");
    const sync = () => { setCompact(query.matches); setDetailOpen(false); };
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const [regions, setRegions] = useState<FeatureCollection>({ type: "FeatureCollection", features: [] });
  const [reports, setReports] = useState<FeatureCollection>({ type: "FeatureCollection", features: [] });
  const [layers, setLayers] = useState<MapLayers>({
    tidal_stations: { type: "FeatureCollection", features: [] },
    coastlines: { type: "FeatureCollection", features: [] },
    critical_infrastructure: { type: "FeatureCollection", features: [] },
    evacuation_routes: { type: "FeatureCollection", features: [] },
  });
  const [activeWarning, setActiveWarning] = useState<ActiveWarning | null>(null);
  const [freshness, setFreshness] = useState<DataFreshness | null>(null);
  const [catalog, setCatalog] = useState<Prediction[]>([]);
  const [selectedRegency, setSelectedRegency] = useState("all");
  const [selectedDate, setSelectedDate] = useState("all");
  const [activeLayers, setActiveLayers] = useState<Record<LayerKey, boolean>>({
    bahaya_rob: true,
    laporan: false,
    pasang_surut: false,
    garis_pantai: false,
    infrastruktur_kritis: false,
    evakuasi: false,
  });
  const [selectedFeature, setSelectedFeature] = useState<GeoJsonFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const layerMenuRef = useRef<HTMLDivElement>(null);
  // Di mobile filter diringkas jadi satu tombol agar peta langsung terlihat.
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  // Deteksi lokasi pengguna (geolokasi browser) untuk memilih wilayah terdekat.
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  // Koordinat asli pengguna [lon, lat] untuk penanda "Anda di sini" di peta.
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Tutup dropdown layer saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!layerMenuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(event.target as Node)) setLayerMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setLayerMenuOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [layerMenuOpen]);

  useEffect(() => { void api<PredictionResponse>("/public/predictions").then((response) => setCatalog(response.data)).catch(() => undefined); }, []);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams();
    if (selectedRegency !== "all") query.set("regency", selectedRegency);
    if (selectedDate !== "all") query.set("date", selectedDate);
    setLoading(true); setError("");
    void api<MapResponse>(`/public/map${query.size ? `?${query.toString()}` : ""}`).then((response) => {
      if (!active) return;
      setRegions(response.data.regions); setReports(response.data.reports);
      if (response.data.layers) setLayers(response.data.layers);
      setActiveWarning(response.data.active_warning ?? null);
      setFreshness(response.data.data_freshness ?? null);
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : "Data peta belum bisa dimuat.");
      // Kosongkan peta saat gagal — tanpa ini toolbar sudah berganti tanggal
      // sementara peta masih menggambar zona dari tanggal sebelumnya.
      setRegions({ type: "FeatureCollection", features: [] });
      setReports({ type: "FeatureCollection", features: [] });
      setFreshness(null);
      setActiveWarning(null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedDate, selectedRegency, reloadVersion]);

  const regencies = useMemo(() => {
    const fromData = catalog.map((item) => item.region?.regency).filter(Boolean);
    return [...new Set(fromData)].sort((a, b) => String(a).localeCompare(String(b), "id")) as string[];
  }, [catalog]);
  const highestRisk = useMemo(() => regions.features.reduce<GeoJsonFeature | null>((highest, feature) => {
    const rank: Record<string, number> = { rendah: 1, sedang: 2, tinggi: 3, sangat_tinggi: 4 };
    return !highest || (rank[String(feature.properties.risk_class)] ?? 0) > (rank[String(highest.properties.risk_class)] ?? 0) ? feature : highest;
  }, null), [regions]);

  // Pakai penanda kesegaran dari server (aturan 30 jam) — hitung ulang
  // per-kalender di sisi klien salah menandai "basi" setiap dini hari
  // (run pipeline 06:00 WIB) dan hanya menyampel satu fitur.
  const isStaleData = freshness?.is_stale ?? false;

  useEffect(() => {
    if (!regions.features.length) { setSelectedFeature(null); return; }
    setSelectedFeature((current) => {
      const stillPresent = current && regions.features.find((f) => f.id === current.id);
      return stillPresent ?? highestRisk;
    });
  }, [regions, highestRisk]);

  const handleSelectFeature = useCallback((feature: GeoJsonFeature) => { setSelectedFeature(feature); setDetailOpen(true); }, []);

  // Deteksi lokasi: ambil koordinat pengguna, pilih wilayah pantau TERDEKAT, lalu
  // filter peta ke kabupatennya (memicu zoom). Perbandingan jarak kuadrat pada
  // derajat cukup untuk mencari yang terdekat pada area sekecil ini.
  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocError("Perangkat ini tidak mendukung deteksi lokasi.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        let nearest: GeoJsonFeature | null = null;
        let bestDistance = Infinity;
        regions.features.forEach((feature) => {
          const center = featureCenter(feature);
          if (!center) return;
          const distance = (center[0] - longitude) ** 2 + (center[1] - latitude) ** 2;
          if (distance < bestDistance) { bestDistance = distance; nearest = feature; }
        });
        setLocating(false);
        // Tandai posisi asli & terbang ke titik itu (lihat efek di RiskMap).
        setUserLocation([longitude, latitude]);
        if (!nearest) {
          setLocError("Belum ada data wilayah untuk dicocokkan.");
          return;
        }
        // Panel kanan menampilkan risiko wilayah pantau terdekat dari posisi.
        setSelectedFeature(nearest);
        setDetailOpen(true);
      },
      (geoError) => {
        setLocating(false);
        setLocError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan izin lokasi di browser lalu coba lagi."
            : "Gagal mendapatkan lokasi. Coba lagi.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [regions]);

  const overallRisk = String(highestRisk?.properties.risk_class ?? "");
  const elevatedRisk = ["tinggi", "sangat_tinggi"].includes(overallRisk);
  const highRiskCount = regions.features.filter((feature) => ["tinggi", "sangat_tinggi"].includes(String(feature.properties.risk_class))).length;
  const riskStatus = loading ? "Memuat kondisi wilayah…" : error ? "Data peta belum tersedia" : highestRisk ? `Risiko saat ini ${riskText(overallRisk).toLowerCase()}` : "Belum ada prediksi untuk pilihan ini";
  const activeFilterCount = Number(selectedDate !== "all") + Number(selectedRegency !== "all");
  const activeLayerCount = Object.values(activeLayers).filter(Boolean).length;
  const details = <MapRegionPanel feature={loading ? null : selectedFeature} userRole={userRole} loading={loading} lastGeneratedAt={freshness?.last_generated_at} />;
  const notices = (error || locError || activeWarning || isStaleData) && <div className="map-notices">
    {error && <InlineNotice tone="error">{error} Gunakan tombol muat ulang untuk mencoba kembali.</InlineNotice>}
    {locError && <InlineNotice tone="error">{locError}</InlineNotice>}
    {activeWarning && <InlineNotice tone="warning" icon="campaign" title={activeWarning.title || "Peringatan risiko"}>{activeWarning.message}</InlineNotice>}
    {isStaleData && <InlineNotice tone="warning" icon="history" title="Prediksi belum diperbarui">{freshness?.notice ?? "Menampilkan pembaruan terakhir. Periksa kondisi di lapangan."}</InlineNotice>}
  </div>;

  return (
    <AppShell active="map" title="Peta Risiko Rob" className="map-app-shell">
      <div className="map-workspace">
        <header className="map-workspace-head">
          <div><h1>Peta risiko rob</h1><p>Pantauan wilayah pesisir Provinsi Lampung.</p></div>
          <div className="map-workspace-update">
            <span>{freshness?.last_generated_at ? `Pembaruan ${formatMapDate(freshness.last_generated_at, true)}` : "Pembaruan data belum tersedia"}</span>
            <button type="button" className="map-icon-action" aria-label="Muat ulang data peta" title="Muat ulang data peta" disabled={loading} onClick={() => setReloadVersion((value) => value + 1)}><Icon name="refresh" /></button>
          </div>
        </header>

        <section className="map-controls" aria-label="Filter peta">
          <button type="button" className="map-filter-toggle" onClick={() => setMobileFilterOpen((open) => !open)} aria-expanded={mobileFilterOpen} aria-controls="map-filters">
            <Icon name="tune" /><span>Filter peta{activeFilterCount > 0 ? ` · ${activeFilterCount} aktif` : ""}</span><Icon name={mobileFilterOpen ? "expand_less" : "expand_more"} />
          </button>
          <div id="map-filters" className={`map-filter-bar${mobileFilterOpen ? " is-open" : ""}`}>
            <div className="map-filter-field"><span>Tanggal prediksi</span><FilterSelect icon="schedule" ariaLabel="Horizon prediksi" value={selectedDate} onChange={setSelectedDate}
              options={[{ value: "all", label: "Terbaru" }, ...HORIZON_OPTIONS.map((horizon) => ({ value: dateFromOffset(horizon.offset), label: horizon.label }))]} /></div>
            <div className="map-filter-field"><span>Kabupaten/kota</span><FilterSelect icon="place" ariaLabel="Kabupaten/Kota" value={selectedRegency} onChange={setSelectedRegency}
              options={[{ value: "all", label: "Semua wilayah" }, ...regencies.map((regency) => ({ value: regency, label: regency, short: regency.replace(/^(Kabupaten|Kota)\s+/, "") }))]} /></div>
            <div className="map-filter-field" ref={layerMenuRef}>
              <span>Lapisan peta</span>
              <button type="button" className="layer-menu-btn" aria-label="Pilihan layer" aria-expanded={layerMenuOpen} aria-controls="map-layer-options" onClick={() => setLayerMenuOpen((open) => !open)}>
                <Icon name="layers" /><span>{activeLayerCount} dari 6 aktif</span><Icon name={layerMenuOpen ? "expand_less" : "expand_more"} />
              </button>
              {layerMenuOpen && <motion.div className="layer-dropdown" id="map-layer-options" role="group" aria-label="Lapisan peta" initial={reducedMotion ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.15 }}>
                {Object.entries({ bahaya_rob: "Bahaya Rob", laporan: "Laporan Warga", pasang_surut: "Pasang Surut", garis_pantai: "Garis Pantai", infrastruktur_kritis: "Infrastruktur", evakuasi: "Jalur Evakuasi" }).map(([key, label]) => (
                  <label key={key} className="layer-option"><input type="checkbox" checked={activeLayers[key as LayerKey]} onChange={(event) => setActiveLayers((previous) => ({ ...previous, [key]: event.target.checked }))} /><span>{label}</span></label>
                ))}
              </motion.div>}
            </div>
          </div>
          <button type="button" className="map-action map-locate" onClick={detectLocation} disabled={locating || loading} aria-label="Deteksi lokasi saya"><Icon name="my_location" />{locating ? "Mendeteksi…" : "Lokasi saya"}</button>
        </section>

        <div className="map-overview">
          <dl className="map-stats-grid">
            {[[regions.features.length, "wilayah terpantau"], [highRiskCount, "risiko tinggi+"], [reports.features.length, "laporan valid"]].map(([value, label]) => (
              <div key={String(label)} title={label === "laporan valid" ? "Maksimal 100 laporan tervalidasi terbaru; tidak dibatasi tanggal prediksi." : undefined}>
                <dt>{label}</dt><dd>{loading ? <Skeleton width={26} height={18} /> : error ? "—" : numberFormatter.format(Number(value))}</dd>
              </div>
            ))}
          </dl>
          <div className={`map-overall-status${!loading && !error ? elevatedRisk || overallRisk === "sedang" ? " elevated" : overallRisk === "rendah" ? " calm" : "" : ""}`} role="status"><Icon name={loading ? "hourglass_empty" : error || !highestRisk ? "info" : elevatedRisk ? "warning" : overallRisk === "rendah" ? "check_circle" : "info"} /><span>{riskStatus}</span></div>
        </div>

        <div className="public-map-layout">
          <section className="map-surface" aria-label="Peta wilayah pantauan">
            <div className="map-viewport" aria-busy={loading}>
              <div className="map-toolbar"><span>{selectedRegency === "all" ? "Pesisir Lampung" : selectedRegency}</span><strong>{selectedDate === "all" ? "Prediksi terbaru" : horizonLabel(selectedDate)}</strong></div>
              {notices}
              <div className="map-container"><RiskMap regions={regions} reports={reports} layers={layers} activeLayers={activeLayers} selectedRegency={selectedRegency} userLocation={userLocation} onSelectFeature={handleSelectFeature} /></div>
              {loading && <div className="map-loading" role="status">Memuat peta…</div>}
            </div>
            <div className="map-legend"><span>Risiko rob</span>{Object.entries(riskLabels).map(([risk, label]) => <span key={risk}><i className={`dot ${riskDotClass[risk]}`} />{label}</span>)}</div>
          </section>
          {!compact && <aside className="map-region-panel" aria-label="Detail wilayah terpilih">{details}</aside>}
        </div>

        {compact && <button type="button" className="map-region-launcher" onClick={() => setDetailOpen(true)} aria-haspopup="dialog" disabled={loading}>
          <Icon name="place" /><span><small>Detail wilayah</small><strong>{loading ? "Memuat wilayah…" : selectedFeature ? String(selectedFeature.properties.village ?? "Wilayah pesisir") : "Pilih wilayah di peta"}</strong></span><Icon name="expand_less" />
        </button>}
      </div>
      {compact && createPortal(<AnimatePresence>{detailOpen && <MapRegionSheet onClose={closeDetails}>{details}</MapRegionSheet>}</AnimatePresence>, document.body)}
    </AppShell>
  );
}
