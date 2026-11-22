import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "../../shared/components/Icon";
import { riskColors, riskLabels } from "../../shared/constants/risk";

export function formatMapDate(value: unknown, withTime = false): string {
  if (typeof value !== "string" || !value) return "Belum tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belum tersedia";
  return withTime
    ? `${date.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB`
    : date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function numericValue(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function MapUpdatedAt({ value }: { value: unknown }) {
  const date = typeof value === "string" && value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return <>Belum tersedia</>;
  return <time dateTime={date.toISOString()}>
    <span className="map-update-date">{date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>{" "}
    <span className="map-update-clock">{date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB</span>
  </time>;
}

export function MapRegionPanel({ feature, userRole, loading, lastGeneratedAt }: {
  feature: { properties: Record<string, unknown> } | null;
  userRole: string;
  loading: boolean;
  lastGeneratedAt?: string | null;
}) {
  const data = feature?.properties;
  const risk = String(data?.risk_class ?? "");
  const probability = numericValue(data?.risk_probability);
  const population = numericValue(data?.population);
  const action = userRole === "peneliti"
    ? { href: "#/research", label: "Buka Arsip Data", icon: "database" }
    : userRole === "admin"
      ? { href: "#/province", label: "Buka pantauan provinsi", icon: "monitoring" }
      : { href: "#/reports", label: "Lapor kejadian di sini", icon: "add_location_alt" };
  return (
    <>
      <header className="map-region-head">
        <span>Wilayah terpilih</span>
        <h2 id="map-region-title">{loading ? "Memuat wilayah…" : data ? String(data.village ?? "Wilayah pesisir") : "Detail wilayah"}</h2>
        {!loading && data && <p>{[data.district, data.regency].filter(Boolean).join(", ")}</p>}
      </header>
      {!loading && data ? (
        <>
          <div className="map-region-probability">
            <div className="map-region-risk">
              <i style={{ background: riskColors[risk] ?? "var(--ink-soft)" }} />{riskLabels[risk] ?? "Belum ada data risiko"}
            </div>
            <strong>{probability !== null && probability <= 100 ? <>{Math.round(probability)}<small>%</small></> : "—"}</strong>
            <span>{probability !== null && probability <= 100 ? "peluang banjir rob" : "Peluang rob belum tersedia"}</span>
          </div>
          <dl className="map-region-facts">
            <div><dt>Tanggal prediksi</dt><dd>{formatMapDate(data.prediction_date)}</dd></div>
            <div><dt>Pembaruan data</dt><dd><MapUpdatedAt value={data.generated_at ?? lastGeneratedAt} /></dd></div>
            <div><dt>Penduduk wilayah</dt><dd>{population === null ? "Belum tersedia" : `${new Intl.NumberFormat("id-ID").format(population)} jiwa`}</dd></div>
          </dl>
          <p className="map-region-caption">Untuk kewaspadaan; ikuti arahan BPBD dan kondisi di lapangan.</p>
          <div className="map-region-actions">
            <a className="map-action primary" href={action.href}><Icon name={action.icon} />{action.label}</a>
            {(!userRole || userRole === "warga") && <a className="map-action" href="#/awam">Buka Mode Awam<Icon name="arrow_forward" /></a>}
          </div>
        </>
      ) : <div className="map-region-empty"><Icon name={loading ? "hourglass_empty" : "ads_click"} /><p>{loading ? "Mengambil prediksi untuk pilihan Anda." : "Pilih penanda di peta untuk melihat prediksi dan informasi wilayah."}</p></div>}
    </>
  );
}

export function MapRegionSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key !== "Tab") return;
      const controls = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <motion.div className="map-sheet-backdrop" initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.16 }} onClick={onClose}>
      <motion.section ref={ref} className="map-region-sheet" role="dialog" aria-modal="true" aria-labelledby="map-region-title"
        initial={reducedMotion ? false : { y: 24 }} animate={{ y: 0 }} exit={{ y: 24 }} transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="map-sheet-close map-icon-action" aria-label="Tutup detail wilayah" onClick={onClose}><Icon name="close" /></button>
        {children}
      </motion.section>
    </motion.div>
  );
}
