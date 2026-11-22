/**
 * Sub-komponen bersama untuk CitizenModePage (mode awam).
 *
 * `CitizenModeDesktop` & `CitizenModeMobile` (dulu ~300 baris JSX tiap
 * komponen) menduplikasi blok forecast, kartu tindakan, laporan sekitar, dan
 * tombol bagikan — setiap perubahan harus ditulis dua kali. Bagian yang sama
 * persis dipindahkan ke sini (AU-15); kedua view tinggal memilih varian
 * (desktop vs compact/mobile) lewat prop `compact`/`variant`.
 */

import { motion, type Variants } from "framer-motion";
import { Icon } from "../../shared/components/Icon";
import { severityLabels, type ReportSeverity } from "../reports/reportData";
import type { RiskClass } from "../../shared/types/domain";

// ─── Tipe data bersama (dipakai halaman & bagian-bagian ini) ────────────────

export type WilayahOption = { label: string; lat: number; lon: number };

export type ForecastItem = { id: string; prediction_date: string; risk_class: RiskClass; risk_probability: number };
export type NearbyReport = { id: string; report_code: string; severity: "ringan" | "sedang" | "parah" | "sangat_parah"; water_height_cm: number | null; incident_time: string; status: string; region?: { village?: string | null; district?: string | null; regency?: string | null } | null };

export type ModeAwamData = {
  // null saat prediksi tidak tersedia — backend tidak lagi mengarang "rendah/0".
  risk_class: RiskClass | null;
  risk_probability: number | null;
  max_tidal_height: number | null;
  peak_time: string | null;
  model_version: string | null;
  confidence_score: number | null;
  data_source: string | null;
  generated_at: string | null;
  is_monitored: boolean;
  monitoring_status: string | null;
  status_label: string | null;
  guidance_message: string | null;
  prediction_status?: "fresh" | "stale" | "unavailable" | null;
  last_generated_at?: string | null;
  prediction_notice?: string | null;
  // `provenance_status` memang dikirim backend (PublicMapController::modeAwam)
  // dan dipakai menandai data contoh; sebelumnya absen dari tipe ini sehingga
  // pembacanya harus lewat `as any`.
  region: {
    id?: string;
    village: string | null;
    district: string | null;
    regency: string | null;
    provenance_status?: string | null;
    data_source?: string | null;
  };
  forecast: { data: ForecastItem[] } | ForecastItem[];
  nearby_reports: NearbyReport[];
};

export type ForecastDay = {
  /** Kunci unik (YYYY-MM-DD). */
  key: string;
  /** Tanggal pendek, mis. "23 Nov". */
  day: string;
  /** Nama hari pendek, mis. "Sen". */
  weekday: string;
  isToday: boolean;
  label: string;
  percent: number;
  color: string;
};
/** Kartu tindakan: `[judul, penjelasan, nama ikon]`. */
export type ActionCard = string[];

// ─── Helper bersama ─────────────────────────────────────────────────────────

export function confidenceLabel(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) return "—";
  const normalized = score > 1 ? score / 100 : score;
  const label = normalized >= 0.8 ? "Tinggi" : normalized >= 0.6 ? "Sedang" : "Rendah";
  return `${label} (${normalized.toFixed(2)})`;
}

export function formatGeneratedAt(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  // timeZone eksplisit: tanpa ini perangkat WITA/WIT menampilkan jam lokalnya
  // sendiri tapi tetap dilabeli "WIB".
  return `${date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })} WIB`;
}

/** Nama wilayah laporan; desktop ikut menampilkan kabupaten, mobile tidak. */
export function reportRegionLabel(report: NearbyReport, includeRegency: boolean): string {
  const parts = includeRegency
    ? [report.region?.village, report.region?.district, report.region?.regency]
    : [report.region?.village, report.region?.district];
  return parts.filter(Boolean).join(", ") || "Wilayah pesisir";
}

export function reportTimeLabel(report: NearbyReport): string {
  const time = new Date(report.incident_time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
  return `${time} WIB`;
}

// ─── Animasi bersama ────────────────────────────────────────────────────────

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, ease: "easeOut" } }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// ─── Bagian yang sama antara tampilan desktop & mobile ──────────────────────

export function ErrorBanner({ error, marginBottom }: { error: string; marginBottom: number }) {
  if (!error) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert" style={{ marginBottom, borderLeftColor: "var(--critical)" }}>
      <Icon name="error" style={{ color: "var(--critical)" }} /> {error}
    </motion.div>
  );
}

export function StatusBadge({ data, compact }: { data: ModeAwamData | undefined; compact?: boolean }) {
  if (!data?.status_label) return null;
  return (
    <span className="citizen-status-badge" data-compact={compact ? "" : undefined}>
      <Icon name={data.is_monitored ? "radar" : "info"} style={{ fontSize: compact ? 14 : 16 }} /> {data.status_label}
    </span>
  );
}

export function PredictionNotice({ data, tone }: { data: ModeAwamData | undefined; tone: "amber" | "frost" }) {
  if (!data?.prediction_notice) return null;
  return (
    <div className={`citizen-prediction-notice ${tone}`}>
      <Icon name={data.prediction_status === "unavailable" ? "schedule" : "update"} style={{ fontSize: tone === "frost" ? 16 : 17, flexShrink: 0, marginTop: 1 }} />
      <span>{data.prediction_notice}</span>
    </div>
  );
}

export function GuidanceText({ data, dataLoaded, compact }: { data: ModeAwamData | undefined; dataLoaded: boolean; compact?: boolean }) {
  const message = data
    ? (data.guidance_message ?? "Pantau kondisi rob di sekitar Anda dan ikuti arahan BPBD.")
    : (dataLoaded
        ? (compact ? "Lokasi di luar wilayah pantauan Lampung. Pilih lokasi dari daftar." : "Lokasi Anda berada di luar wilayah pantauan Lampung. Pilih lokasi lain dari daftar di atas untuk melihat status bahaya rob.")
        : (compact ? "Menganalisis status rob..." : "Menganalisis status ancaman rob terbaru di sekitar Anda..."));
  return <p className={compact ? "citizen-guidance compact" : "citizen-guidance"}>{message}</p>;
}

/**
 * Prakiraan 7 hari sebagai ubin harian: angka peluang besar + label & warna
 * kelas risiko. Menggantikan batang 0–100% yang tampak kosong saat peluangnya
 * kecil, dan grid tujuh kolom yang dulu terpotong (scrollbar disembunyikan)
 * sehingga hari ke-7 tak terlihat. Desktop & mobile memakai komponen yang sama.
 */
export function ForecastTiles({ days, compact }: { days: ForecastDay[]; compact?: boolean }) {
  return (
    <ol className={compact ? "citizen-tiles compact" : "citizen-tiles"}>
      {days.map((d, index) => (
        <motion.li
          key={d.key}
          className={d.isToday ? "citizen-tile is-today" : "citizen-tile"}
          style={{ ["--tile-color" as string]: d.color }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + index * 0.05, duration: 0.4, ease: "easeOut" }}
          title={`${d.day}: ${d.label}, peluang ${d.percent}%`}
        >
          <span className="citizen-tile-dow">{d.isToday ? "Hari ini" : d.weekday}</span>
          <span className="citizen-tile-pct">{d.percent}<small>%</small></span>
          <span className="citizen-tile-cls">{d.label}</span>
          <span className="citizen-tile-date">{d.day}</span>
        </motion.li>
      ))}
    </ol>
  );
}

/**
 * Rekomendasi tindakan per kelas risiko. Dulu daftarnya tetap (warga berstatus
 * "Rendah" tetap disuruh "Jauhi area rendah"); kini mengikuti status dan
 * selaras dengan pesan panduan backend (MapService::modeAwamGuidanceMessage).
 */
export function recommendationsFor(riskClass: RiskClass | null | undefined, isMonitored: boolean): ActionCard[] {
  if (!isMonitored || !riskClass) {
    return [
      ["Tetap waspada", "Perhatikan kondisi sekitar, terutama saat pasang tinggi.", "visibility"],
      ["Ikuti arahan BPBD", "Utamakan informasi resmi dari petugas dan perangkat kelurahan.", "campaign"],
    ];
  }
  switch (riskClass) {
    case "sangat_tinggi":
      return [
        ["Bersiap mengungsi", "Siapkan tas darurat dan ketahui tujuan aman bila air mulai naik.", "directions_run"],
        ["Amankan rumah", "Pindahkan barang penting ke tempat tinggi dan matikan listrik bila air masuk.", "power_off"],
        ["Ikuti arahan BPBD", "Utamakan informasi resmi dari petugas dan perangkat kelurahan.", "campaign"],
      ];
    case "tinggi":
      return [
        ["Hindari area rendah", "Kurangi aktivitas di jalan pesisir dan area yang mudah tergenang.", "block"],
        ["Amankan barang penting", "Pindahkan dokumen dan barang elektronik ke tempat yang lebih tinggi.", "inventory_2"],
        ["Pantau puncak pasang", "Perhatikan jam puncak pasang dan perubahan muka air di sekitar Anda.", "waves"],
      ];
    case "sedang":
      return [
        ["Waspada saat puncak pasang", "Hindari tepi pantai dan area rendah menjelang jam puncak pasang.", "schedule"],
        ["Cek saluran air", "Pastikan selokan di sekitar rumah tidak tersumbat agar air cepat surut.", "water_drop"],
        ["Pantau pembaruan", "Kondisi bisa berubah; cek prakiraan secara berkala.", "update"],
      ];
    case "rendah":
    default:
      return [
        ["Pantau pembaruan", "Prediksi diperbarui setiap pagi. Cek lagi sebelum beraktivitas di pesisir.", "update"],
        ["Kenali jalur aman", "Ketahui jalan yang tidak mudah tergenang menuju tempat yang lebih tinggi.", "route"],
        ["Simpan nomor penting", "Catat kontak BPBD dan perangkat kelurahan untuk keadaan darurat.", "contact_phone"],
      ];
  }
}

/** Hiasan ombak halus di dasar kartu status (menggantikan ikon raksasa). */
export function HeroWaves() {
  return (
    <svg className="citizen-hero-waves" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
      <path className="w1" d="M0 70 Q150 40 300 70 T600 70 T900 70 T1200 70 V120 H0 Z" />
      <path className="w2" d="M0 88 Q150 62 300 88 T600 88 T900 88 T1200 88 V120 H0 Z" />
    </svg>
  );
}

/** Keadaan kosong laporan warga — lebih ramah daripada tabel berkepala tanpa isi. */
export function NearbyReportsEmpty({ showReportButton, compact }: { showReportButton: boolean; compact?: boolean }) {
  return (
    <div className={compact ? "citizen-reports-empty compact" : "citizen-reports-empty"}>
      <span className="citizen-reports-empty-icon"><Icon name="check_circle" /></span>
      <div>
        <strong>Belum ada laporan genangan di sekitar lokasi ini</strong>
        <p>Laporan warga yang sudah divalidasi petugas akan muncul di sini.</p>
      </div>
      {showReportButton && (
        <a className="btn secondary" href="#/reports">
          <Icon name="add_location_alt" /> Laporkan Genangan
        </a>
      )}
    </div>
  );
}

/** Kartu tindakan mitigasi; tombol "Laporkan kejadian" mengarah ke form laporan. */
export function CitizenActionCard({ card, variant }: { card: ActionCard; variant: "desktop" | "mobile" }) {
  const [title, copy, icon] = card;
  const isReportBtn = title === "Laporkan kejadian";
  const compact = variant === "mobile";
  const handleClick = () => { if (isReportBtn) window.location.hash = "#/reports"; };
  return (
    <motion.div
      className={compact ? "mobile-action-card" : "citizen-action-card"}
      whileHover={compact ? undefined : { x: 4 }}
      onClick={handleClick}
      style={{
        cursor: isReportBtn ? "pointer" : "default",
        ...(compact ? { border: isReportBtn ? "1px solid var(--accent-blue)" : undefined } : { borderRadius: 8, display: "flex", gap: 16, alignItems: "flex-start" }),
      }}
    >
      <div style={compact
        ? { width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: isReportBtn ? "rgba(37,99,235,0.1)" : "var(--surface-soft)", color: isReportBtn ? "var(--accent-blue)" : "var(--ink-soft)" }
        : { width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-soft)", color: isReportBtn ? "var(--accent-blue)" : "var(--ink-soft)", flexShrink: 0 }}>
        <Icon name={icon} style={{ fontSize: compact ? 20 : 24 }} />
      </div>
      <div style={compact ? {} : { paddingTop: 2 }}>
        <strong style={compact
          ? { display: "block", fontSize: "13px", lineHeight: 1.3, marginBottom: 4, color: isReportBtn ? "var(--accent-blue)" : "var(--ink-primary)" }
          : { display: "block", marginBottom: 6, fontSize: "15px", color: isReportBtn ? "var(--accent-blue)" : "var(--ink-primary)" }}>{title}</strong>
        <p style={compact
          ? { margin: 0, fontSize: "12px", color: "var(--ink-soft)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }
          : { margin: 0, fontSize: "14px", color: "var(--ink-soft)", lineHeight: 1.6 }}>{copy}</p>
      </div>
    </motion.div>
  );
}

export function ReportSeverityBadge({ report, dense }: { report: NearbyReport; dense?: boolean }) {
  return (
    <span className={`badge severity-${report.severity}`} style={dense ? { padding: "4px 8px", fontSize: 11 } : undefined}>
      {report.water_height_cm ? `${report.water_height_cm} cm` : severityLabels[report.severity as ReportSeverity]}
    </span>
  );
}

export function ReportValidatedBadge({ label, dense }: { label: string; dense?: boolean }) {
  return (
    <span className="badge status-divalidasi" style={dense ? { padding: "4px 8px", fontSize: 11 } : undefined}>
      <Icon name="verified" style={{ fontSize: dense ? 12 : 14 }} /> {label}
    </span>
  );
}

export function ShareWarningButtons({ onWhatsApp, onCopy, compact }: {
  onWhatsApp: () => void;
  onCopy: () => void;
  compact?: boolean;
}) {
  const btnStyle = compact
    ? { width: "100%", justifyContent: "center", fontSize: "13.5px", padding: "12px", gap: 8 }
    : { width: "100%", justifyContent: "center", fontSize: "14px" };
  return (
    <div className={compact ? "citizen-share-actions compact" : "citizen-share-actions"}>
      <button className="btn primary" type="button" onClick={onWhatsApp} style={{ background: "#16a34a", borderColor: "#16a34a", ...btnStyle }}>
        <Icon name="share" style={compact ? { fontSize: 18 } : undefined} /> Bagikan via WhatsApp
      </button>
      <button className="btn secondary" type="button" onClick={onCopy} style={btnStyle}>
        <Icon name="content_copy" style={compact ? { fontSize: 18 } : undefined} /> Salin Teks Peringatan
      </button>
    </div>
  );
}

/** Nama sumber data internal → keterangan yang dimengerti warga. */
function dataSourceLabel(value: string | null | undefined): string {
  if (!value) return "—";
  if (/open-?meteo/i.test(value)) return "Model SAIBAR · data cuaca & gelombang Open-Meteo";
  return value;
}

/**
 * Detail teknis prediksi, dilipat secara default: warga cukup melihat status,
 * yang ingin tahu bisa membukanya. Warna netral — dulu "Kepercayaan Rendah"
 * ditampilkan hijau sehingga terbaca sebagai kabar baik.
 */
export function ModelInfoPanel({ data }: { data: ModeAwamData | undefined }) {
  return (
    <motion.section variants={itemVariants} className="panel citizen-model-panel">
      <details>
        <summary>
          <Icon name="info" />
          <span>Detail teknis prediksi</span>
          <Icon name="expand_more" className="citizen-model-chevron" />
        </summary>
        <dl>
          <div><dt>Diperbarui</dt><dd>{formatGeneratedAt(data?.generated_at)}</dd></div>
          <div><dt>Sumber</dt><dd>{dataSourceLabel(data?.data_source)}</dd></div>
          <div><dt>Model</dt><dd>{data?.model_version ?? "—"}</dd></div>
          <div><dt>Keyakinan model</dt><dd>{confidenceLabel(data?.confidence_score)}</dd></div>
        </dl>
        <p className="citizen-model-note">
          Prediksi adalah alat kewaspadaan, bukan kepastian. Gunakan bersama arahan resmi BPBD dan kondisi nyata di
          lapangan.
        </p>
      </details>
    </motion.section>
  );
}

// ─── CSS yang wajib ikut disuntikkan kedua view (via tag <style>) ───────────

export const CITIZEN_SHARED_STYLES = `
  .citizen-status-badge {
    align-items: center;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    display: inline-flex;
    font-size: 13px;
    font-weight: 650;
    gap: 6px;
    margin-bottom: 16px;
    padding: 5px 12px;
  }
  .citizen-status-badge[data-compact] { font-size: 12px; margin-bottom: 12px; padding: 4px 10px; }

  .citizen-prediction-notice {
    align-items: flex-start;
    background: rgba(245, 158, 11, 0.18);
    border: 1px solid rgba(245, 158, 11, 0.5);
    border-radius: 12px;
    display: flex;
    font-size: 13.5px;
    gap: 8px;
    line-height: 1.5;
    margin-bottom: 16px;
    max-width: 600px;
    padding: 10px 14px;
  }
  .citizen-prediction-notice.frost {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    color: white;
    font-size: 13px;
    max-width: none;
  }

  .citizen-guidance {
    color: rgba(255, 255, 255, 0.95);
    font-size: 1.15rem;
    line-height: 1.6;
    margin: 0 0 40px 0;
    max-width: 600px;
  }
  .citizen-guidance.compact {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    line-height: 1.5;
    margin: 0 0 24px 0;
    max-width: none;
  }

  .citizen-share-actions.compact { display: flex; flex-direction: column; gap: 10px; }

  /* Hiasan ombak di dasar kartu status */
  .citizen-hero-waves {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 90px;
    pointer-events: none;
  }
  .citizen-hero-waves .w1 { fill: rgba(255, 255, 255, 0.08); }
  .citizen-hero-waves .w2 { fill: rgba(255, 255, 255, 0.06); }

  /* Ubin prakiraan 7 hari */
  .citizen-tiles {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    gap: 10px;
    list-style: none;
    margin: 0;
    padding: 20px 24px 24px;
  }
  .citizen-tile {
    align-items: center;
    background: color-mix(in srgb, var(--tile-color) 10%, var(--surface));
    border: 1px solid color-mix(in srgb, var(--tile-color) 24%, transparent);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    padding: 12px 4px 10px;
    text-align: center;
  }
  .citizen-tile.is-today { border-color: var(--tile-color); box-shadow: inset 0 0 0 1px var(--tile-color); }
  .citizen-tile-dow { color: var(--ink-soft); font-size: 12px; font-weight: 650; white-space: nowrap; }
  .citizen-tile.is-today .citizen-tile-dow { color: var(--ink); font-weight: 750; }
  .citizen-tile-pct { color: var(--ink); font-size: 1.45rem; font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; margin-top: 2px; }
  .citizen-tile-pct small { color: var(--ink-soft); font-size: 0.72rem; font-weight: 700; margin-left: 1px; }
  .citizen-tile-cls { color: var(--tile-color); font-size: 11.5px; font-weight: 750; white-space: nowrap; }
  .citizen-tile-date { color: var(--ink-soft); font-size: 11px; white-space: nowrap; }
  .citizen-tiles.compact { gap: 5px; padding: 0; }
  .citizen-tiles.compact .citizen-tile { border-radius: 10px; padding: 9px 2px 8px; }
  .citizen-tiles.compact .citizen-tile-dow { font-size: 10.5px; }
  .citizen-tiles.compact .citizen-tile-pct { font-size: 1.02rem; }
  .citizen-tiles.compact .citizen-tile-pct small { font-size: 0.6rem; }
  .citizen-tiles.compact .citizen-tile-cls,
  .citizen-tiles.compact .citizen-tile-date { display: none; }
  @media (max-width: 900px) {
    .citizen-tiles:not(.compact) .citizen-tile-cls { font-size: 10px; }
    .citizen-tiles:not(.compact) .citizen-tile-pct { font-size: 1.2rem; }
  }

  /* Laporan warga kosong */
  .citizen-reports-empty {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 14px 16px;
    padding: 22px 24px;
  }
  .citizen-reports-empty > div { flex: 1 1 240px; min-width: 0; }
  .citizen-reports-empty strong { color: var(--ink); display: block; font-size: 14.5px; margin-bottom: 2px; }
  .citizen-reports-empty p { color: var(--ink-soft); font-size: 13.5px; line-height: 1.5; margin: 0; }
  .citizen-reports-empty-icon {
    align-items: center;
    background: color-mix(in srgb, var(--low) 14%, transparent);
    border-radius: 12px;
    color: var(--low);
    display: inline-flex;
    flex: none;
    height: 42px;
    justify-content: center;
    width: 42px;
  }
  .citizen-reports-empty .btn { white-space: nowrap; }
  .citizen-reports-empty.compact {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 16px;
  }
  .citizen-reports-empty.compact .btn { justify-content: center; width: 100%; }

  /* Detail teknis (dilipat) */
  .citizen-model-panel { background: var(--surface-soft) !important; border: none !important; padding: 0 !important; }
  .citizen-model-panel summary {
    align-items: center;
    color: var(--ink);
    cursor: pointer;
    display: flex;
    font-size: 14px;
    font-weight: 700;
    gap: 8px;
    list-style: none;
    padding: 16px 20px;
  }
  .citizen-model-panel summary::-webkit-details-marker { display: none; }
  .citizen-model-panel summary .material-symbols-outlined:first-child { color: var(--ink-soft); font-size: 19px; }
  .citizen-model-chevron { color: var(--ink-soft); font-size: 20px; margin-left: auto; transition: transform 0.2s ease; }
  .citizen-model-panel details[open] .citizen-model-chevron { transform: rotate(180deg); }
  .citizen-model-panel dl { display: grid; gap: 0; margin: 0; padding: 0 20px; }
  .citizen-model-panel dl > div {
    border-top: 1px solid var(--line);
    display: grid;
    font-size: 13px;
    gap: 12px;
    grid-template-columns: 110px 1fr;
    padding: 9px 0;
  }
  .citizen-model-panel dt { color: var(--ink-soft); }
  .citizen-model-panel dd { color: var(--ink); font-weight: 600; margin: 0; text-align: right; }
  .citizen-model-note { color: var(--ink-soft); font-size: 12.5px; line-height: 1.5; margin: 0; padding: 10px 20px 18px; }
`;
