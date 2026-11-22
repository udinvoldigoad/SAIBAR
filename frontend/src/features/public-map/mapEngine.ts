/**
 * Pemilih mesin peta untuk PETA UTAMA (halaman Peta Risiko) saja.
 *
 * - Bila `VITE_MAPBOX_TOKEN` terisi → Mapbox GL JS v3 + gaya "Mapbox Standard"
 *   (siang/malam mengikuti tema aplikasi lewat `lightPreset`).
 * - Bila kosong / gagal dimuat → MapLibre + tile OpenStreetMap seperti semula,
 *   jadi aplikasi tetap jalan tanpa token (mis. di lokal teman satu tim).
 *
 * Peta di halaman laporan (lapor & detail) SENGAJA tetap MapLibre agar kuota
 * map load Mapbox hanya terpakai di peta utama. Mapbox dimuat dinamis supaya
 * bundelnya (~1,7 MB) tidak ikut diunduh saat fallback dipakai.
 *
 * API Mapbox GL dan MapLibre nyaris identik (MapLibre adalah fork-nya), jadi
 * modul Mapbox diperlakukan dengan tipe MapLibre — cukup untuk Map, Marker,
 * Popup, LngLatBounds, kontrol, dan GeoJSON source yang dipakai halaman ini.
 */
import maplibregl from "maplibre-gl";

export const MAPBOX_TOKEN = String(import.meta.env.VITE_MAPBOX_TOKEN ?? "").trim();

export type MapEngineKind = "mapbox" | "maplibre";
export type MapEngine = { gl: typeof maplibregl; kind: MapEngineKind };

/** Gaya basemap untuk mesin MapLibre (fallback): raster OSM + glyph lokal. */
export const MAPLIBRE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  // Glyph di-host sendiri (frontend/public/fonts/opensans/0-255.pbf) alih-alih
  // fonts.openmaptiles.org — server demo itu diblokir CSP produksi.
  glyphs: "/fonts/{fontstack}/{range}.pbf",
  sources: { osm: { type: "raster", tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], tileSize: 256, attribution: "© OpenStreetMap contributors" } },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

export const MAPBOX_STYLE = "mapbox://styles/mapbox/standard";

export async function loadMapEngine(): Promise<MapEngine> {
  if (!MAPBOX_TOKEN) return { gl: maplibregl, kind: "maplibre" };
  try {
    const [mod] = await Promise.all([import("mapbox-gl"), import("mapbox-gl/dist/mapbox-gl.css")]);
    const mapboxgl = mod.default;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    return { gl: mapboxgl as unknown as typeof maplibregl, kind: "mapbox" };
  } catch (error) {
    console.warn("[SAIBAR] Mapbox gagal dimuat, kembali ke MapLibre.", error);
    return { gl: maplibregl, kind: "maplibre" };
  }
}

/** Preset cahaya Mapbox Standard sesuai tema aplikasi (atribut data-theme). */
export function lightPresetForTheme(): "day" | "night" {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "night" : "day";
}

type MapboxConfigurable = { setConfigProperty(importId: string, key: string, value: unknown): void };

/** Terapkan konfigurasi basemap Mapbox Standard (tanpa efek di MapLibre). */
export function applyMapboxBasemap(map: maplibregl.Map, engine: MapEngineKind): void {
  if (engine !== "mapbox") return;
  const target = map as unknown as MapboxConfigurable;
  target.setConfigProperty("basemap", "lightPreset", lightPresetForTheme());
  // Peta risiko: label tempat & jalan tetap, ikon POI (kafe, toko, dst.)
  // disembunyikan agar zona risiko & laporan tidak tenggelam.
  target.setConfigProperty("basemap", "showPointOfInterestLabels", false);
  target.setConfigProperty("basemap", "show3dObjects", true);
}

/**
 * Properti tambahan layer khusus Mapbox Standard. `slot` menentukan posisi
 * layer kita di antara layer basemap (bottom: di atas area, middle: di atas
 * jalan & di bawah bangunan 3D, top: di atas label POI). MapLibre tidak
 * mengenal `slot`, jadi di sana dikosongkan.
 */
export function layerSlot(engine: MapEngineKind, slot: "bottom" | "middle" | "top"): Record<string, string> {
  return engine === "mapbox" ? { slot } : {};
}

/** Font label cluster: glyph lokal di MapLibre, font bawaan Mapbox di Standard. */
export function labelFont(engine: MapEngineKind): string[] {
  return engine === "mapbox" ? ["DIN Pro Bold", "Arial Unicode MS Bold"] : ["opensans"];
}

/**
 * Di Mapbox Standard layer kita ikut "diterangi" cahaya basemap, sehingga pada
 * preset malam warna zona/cluster risiko nyaris hitam. Emissive strength 1
 * membuat warna data tetap menyala apa pun presetnya. MapLibre tidak mengenal
 * properti ini, jadi di sana dikosongkan.
 */
export function emissive(engine: MapEngineKind, type: "circle" | "fill" | "line" | "text" | "fill-extrusion"): Record<string, number> {
  return engine === "mapbox" ? { [`${type}-emissive-strength`]: 1 } : {};
}

/**
 * Batas geser peta: wilayah Indonesia (+ sedikit tepi). Peta tidak bisa
 * digeser/di-zoom-out ke luar area ini, sehingga tile yang dimuat tetap
 * sedikit dan pengguna tidak "tersesat" ke benua lain.
 */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [[94.0, -11.8], [141.8, 6.8]];
export const MIN_ZOOM = 4;

/** Kolom 3D risiko hanya ditampilkan saat peta dimiringkan lebih dari ini. */
export const EXTRUSION_MIN_PITCH = 15;
