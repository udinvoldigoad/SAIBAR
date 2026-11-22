import { useEffect, useRef, useState } from "react";
import { AppShell } from "../../shared/components/AppShell";
import { useToast } from "../../shared/components/Toast";
import { fetchOperatorReports, severityLabels, updateOperatorReportStatus, type OperatorReport, type ReportSeverity } from "../reports/reportData";
import { api, downloadFile, errorMessage } from "../../shared/api/client";
import { Icon } from "../../shared/components/Icon";
import { LoadingBlock } from "../../shared/components/LoadingBlock";
import { riskColors, riskLabels } from "../../shared/constants/risk";
import "./dashboardKit.css";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, ease: "easeOut" }
  }
};

/** Warna aksen per tingkat keparahan laporan (selaras badge & garis kiri). */
const SEVERITY_COLOR: Record<ReportSeverity, string> = {
  ringan: "var(--low)",
  sedang: "var(--medium)",
  parah: "var(--high)",
  sangat_parah: "var(--critical)",
};

const relativeTime = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

/** "5 menit lalu", "3 jam lalu", "4 bulan lalu" — seberapa lama laporan menunggu. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((then - Date.now()) / 1000);
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000], ["month", 2_592_000], ["day", 86_400], ["hour", 3_600], ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit);
  }
  return "baru saja";
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

type OperatorSummary = {
  monitored_villages: number;
  critical_villages: number;
  pending_reports: number;
  monthly_validations: number;
  operator_regency?: string | null;
  scope_label?: string | null;
  latest_prediction_date?: string | null;
  region_statuses: {
    id: string;
    village: string | null;
    district: string | null;
    regency: string | null;
    population: number | null;
    risk_class: string;
    risk_probability: number;
  }[];
};

type OperatorSummaryResponse = { data: OperatorSummary };

export function OperatorDashboardPage() {
  const [reports, setReports] = useState<OperatorReport[]>([]);
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });
  const [summary, setSummary] = useState<OperatorSummary>({
    monitored_villages: 0,
    critical_villages: 0,
    pending_reports: 0,
    monthly_validations: 0,
    region_statuses: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<ReportSeverity | "">("");
  const [slaOverdue, setSlaOverdue] = useState(false);
  const [activeTab, setActiveTab] = useState<"antrean" | "riwayat">("antrean");
  // Waktu data terakhir berhasil dimuat (ditampilkan di header halaman).
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  // Untuk mendeteksi kedatangan laporan baru antar polling (null = belum ada baseline).
  const prevPendingRef = useRef<number | null>(null);
  // Panel antrean — target scroll dari tombol "Lihat laporan" di banner.
  const queueRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Penanda urutan request: polling 30 detik bisa bertabrakan dengan aksi
  // pengguna (ganti halaman/filter). Tanpa ini respons polling yang datang
  // belakangan menimpa halaman yang baru saja dibuka operator.
  const loadSeqRef = useRef(0);

  const loadReports = async (targetPage = page, options: { silent?: boolean } = {}) => {
    const seq = ++loadSeqRef.current;
    // silent: dipakai polling — refresh data tanpa mem-flash "Memuat laporan..."
    // dan tanpa menghilangkan blok paginasi tiap 30 detik.
    if (!options.silent) setIsLoading(true);
    try {
      const statusFilter = activeTab === "riwayat" ? "divalidasi,ditolak" : "menunggu,perlu_review";
      const [data, summaryRes] = await Promise.all([
        fetchOperatorReports(targetPage, 20, { severity: severityFilter, slaOverdue, status: statusFilter }),
        api<OperatorSummaryResponse>("/dashboard/operator/summary"),
      ]);

      // Hasil usang — jangan sentuh state maupun baseline notifikasi.
      if (seq !== loadSeqRef.current) return;

      // Alert laporan baru: bila jumlah antrean bertambah sejak polling terakhir
      // (bukan pemuatan pertama), beri tahu operator tanpa refresh manual.
      const newPending = summaryRes.data.pending_reports;
      if (prevPendingRef.current !== null && newPending > prevPendingRef.current) {
        const delta = newPending - prevPendingRef.current;
        toast.info(`${delta} laporan baru masuk ke antrean.`);
      }
      prevPendingRef.current = newPending;
      // Kalau laporan di halaman ini habis tervalidasi/tolak dan halaman jadi kosong
      // (bukan halaman pertama), mundur satu halaman alih-alih menampilkan antrean kosong palsu.
      if (data.reports.length === 0 && data.currentPage > 1 && data.total > 0) {
        return loadReports(data.currentPage - 1);
      }
      setReports(data.reports);
      setPage(data.currentPage);
      setPageMeta({ currentPage: data.currentPage, lastPage: data.lastPage, total: data.total, from: data.from, to: data.to });
      setSummary(summaryRes.data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      if (seq !== loadSeqRef.current) return;
      toast.error(err instanceof Error ? err.message : "Gagal memuat antrean laporan.");
    } finally {
      if (seq === loadSeqRef.current) setIsLoading(false);
    }
  };

  // Muat ulang & reset polling saat filter berubah. Polling menyegarkan
  // HALAMAN AKTIF secara senyap — dulu selalu loadReports(1) sehingga operator
  // yang sedang membaca halaman 2/3 dilempar balik ke halaman 1 tiap 30 detik.
  const pageRef = useRef(page);
  pageRef.current = page;
  useEffect(() => {
    loadReports(1);
    const timer = window.setInterval(() => loadReports(pageRef.current, { silent: true }), 30000);
    return () => window.clearInterval(timer);
  }, [severityFilter, slaOverdue, activeTab]);

  const changePage = (nextPage: number) => {
    if (nextPage < 1 || nextPage > pageMeta.lastPage || nextPage === page) return;
    void loadReports(nextPage);
  };

  const handleValidate = async (report: OperatorReport) => {
    try {
      await updateOperatorReportStatus(report.id, "divalidasi");
      await loadReports();
      toast.success(`Laporan ${report.code} berhasil divalidasi ke database.`);
    } catch {
      toast.error("Gagal melakukan validasi laporan.");
    }
  };

  const handleReject = async (report: OperatorReport) => {
    try {
      await updateOperatorReportStatus(report.id, "ditolak", "Ditolak oleh admin BPBD");
      await loadReports();
      toast.info(`Laporan ${report.code} telah ditolak.`);
    } catch {
      toast.error("Gagal melakukan penolakan laporan.");
    }
  };

  // Total antrean sebenarnya dari backend (summary.pending_reports), bukan hitungan
  // halaman ini saja -- dengan paginasi, `reports` cuma memuat laporan halaman aktif.
  const pendingCount = summary.pending_reports;
  const triageCountOnPage = reports.filter((r) => !r.isWithinMonitoringArea || r.status === "perlu_review").length;
  const operatorArea = summary.scope_label ?? summary.operator_regency ?? "Provinsi Lampung";

  const handleExport = async () => {
    try {
      await downloadFile("/dashboard/operator/reports/export", "dashboard-admin-laporan.csv");
      toast.success("Export laporan admin berhasil diunduh.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal export laporan admin."));
    }
  };

  return (
    <AppShell active="operator" title="Operator">
      <style>{`
        .operator-pagination { align-items: center; border-top: 1px solid var(--line); display: flex; gap: 8px; justify-content: space-between; padding: 14px 24px; flex-wrap: wrap; }
        .operator-page-btn { align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; color: var(--ink); cursor: pointer; display: inline-flex; height: 34px; justify-content: center; min-width: 34px; padding: 0 10px; }
        .operator-page-btn:hover:not(:disabled) { background: var(--surface-soft); border-color: var(--ocean-dark); }
        .operator-page-btn.active { background: var(--ocean-mid); border-color: var(--ocean-mid); color: #fff; font-weight: 800; }
        .operator-page-btn:disabled { cursor: not-allowed; opacity: .45; }
        .dashboard-split-layout { display: grid; gap: 24px; }

        @media (max-width: 768px) {
          .op-filter-row .op-filter-select { flex: 1 1 100%; width: auto; }
          .op-filter-row .op-filter-btn { flex: 1 1 0; }
          .op-filter-row .op-filter-btn.export { margin-left: 0; }
        }

        /* Header panel antrean: switcher + subjudul + filter, ditumpuk rapi. */
        .op-panel-head { padding: 18px 20px; border-bottom: 1px solid var(--line); display: grid; gap: 14px; }

        /* Switcher tab modern (segmented control). */
        .op-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: var(--surface-soft); border: 1px solid var(--line); border-radius: 12px; padding: 4px; width: 100%; max-width: 400px; }
        .op-tab { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 0; background: transparent; color: var(--ink-soft); font: inherit; font-size: 0.9rem; font-weight: 600; padding: 9px 10px; border-radius: 9px; cursor: pointer; transition: background .15s, color .15s, box-shadow .15s; }
        .op-tab:hover { color: var(--ink); }
        .op-tab.active { background: var(--surface); color: var(--ocean-dark); box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
        .op-tab-count { font-size: 11px; font-weight: 800; line-height: 1; background: var(--critical); color: #fff; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; }

        .op-subtitle { color: var(--ink-soft); font-size: 12px; }

        /* Filter di kiri, Export (tombol sekunder) di kanan. */
        .op-filter-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .op-filter-row .op-filter-select { width: 190px; }
        .op-filter-row .op-filter-btn { width: auto; padding: 0 14px; }
        .op-filter-row .op-filter-btn.export { margin-left: auto; }
        .op-filter-select, .op-filter-btn { min-width: 0; width: 100%; height: 40px; border-radius: 9px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); font-size: 13px; font-weight: 600; padding: 0 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
        .op-filter-btn { white-space: nowrap; overflow: hidden; }
        .op-filter-btn .op-btn-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .op-filter-btn:hover { border-color: var(--ocean-dark); }
        .op-filter-btn.active { background: var(--critical); border-color: var(--critical); color: #fff; }
        .op-filter-btn.export { color: var(--ocean-dark); }
        .op-filter-btn.export:hover { background: var(--ocean-light); border-color: var(--ocean-dark); }

        /* Baris laporan ringkas: tinggi air | isi | aksi. */
        .op-report { border-bottom: 1px solid var(--line); border-left: 4px solid transparent; padding: 16px 20px; transition: background .15s; }
        .op-report:hover { background: color-mix(in srgb, var(--surface-soft) 55%, transparent); }
        .op-report:last-child { border-bottom: 0; }
        .op-report-grid { align-items: center; display: grid; gap: 16px; grid-template-columns: 68px minmax(0, 1fr) auto; }
        .op-water { align-items: center; background: color-mix(in srgb, var(--sev) 12%, transparent); border-radius: 12px; color: var(--sev); display: flex; flex-direction: column; justify-content: center; line-height: 1; min-height: 64px; padding: 8px 4px; }
        .op-water strong { font-size: 1.45rem; font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.02em; }
        .op-water span { font-size: 11px; font-weight: 700; margin-top: 3px; opacity: .85; }
        .op-water.none strong { font-size: 1.1rem; }
        .op-report-title { color: var(--ink); font-size: 15px; font-weight: 700; line-height: 1.35; }
        .op-report-title span { color: var(--ink-soft); font-weight: 500; }
        .op-report-meta { align-items: center; color: var(--ink-soft); display: flex; flex-wrap: wrap; font-size: 12.5px; gap: 4px 10px; margin-top: 3px; }
        .op-report-meta code { background: var(--surface-soft); border-radius: 6px; color: var(--ink); font-size: 11.5px; padding: 1px 6px; }
        .op-report-meta .material-symbols-outlined { font-size: 15px; vertical-align: -3px; }
        .op-report-text { -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: var(--ink); display: -webkit-box; font-size: 13.5px; line-height: 1.5; margin: 6px 0 0; overflow: hidden; }
        .op-report-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        /* Badge keparahan memakai warna yang sama dengan kotak tinggi air, di
           mode terang & gelap (gaya badge global tak konsisten di mode gelap). */
        :root .op-report-tags .badge[class] { background: color-mix(in srgb, var(--sev) 13%, transparent); border-color: transparent; color: var(--sev); font-size: 11.5px; font-weight: 700; padding: 3px 9px; }
        .op-chip { align-items: center; border-radius: 999px; display: inline-flex; font-size: 11.5px; font-weight: 700; gap: 4px; padding: 3px 9px; }
        .op-chip .material-symbols-outlined { font-size: 14px; }
        .op-chip.late { background: color-mix(in srgb, var(--critical) 12%, transparent); color: var(--critical); }
        .op-chip.triage { background: color-mix(in srgb, var(--medium) 16%, transparent); color: #b45309; }
        :root[data-theme="dark"] .op-chip.triage { color: #fbbf24; }
        .op-report-actions { align-items: center; display: flex; gap: 6px; }
        .op-act { align-items: center; background: var(--surface); border: 1px solid var(--line); border-radius: 9px; color: var(--ink); cursor: pointer; display: inline-flex; font: inherit; font-size: 13px; font-weight: 650; gap: 5px; height: 36px; padding: 0 12px; text-decoration: none; white-space: nowrap; }
        .op-act .material-symbols-outlined { font-size: 18px; }
        .op-act:hover { border-color: var(--ocean-dark); }
        .op-act.validate { background: var(--low); border-color: var(--low); color: #fff; }
        .op-act.validate:hover { filter: brightness(1.06); }
        .op-act.reject { color: var(--critical); }
        .op-act.reject:hover { background: color-mix(in srgb, var(--critical) 8%, transparent); border-color: var(--critical); }

        @media (max-width: 768px) {
          .op-panel-head { padding: 16px; }
          .op-tabs { max-width: none; }
          /* Label tombol filter diringkas ("SLA"/"Export") agar muat 3 kolom. */
          .op-btn-suffix { display: none; }
          .op-report { padding: 14px 16px; }
          .op-report-grid { grid-template-columns: 56px minmax(0, 1fr); gap: 12px; align-items: start; }
          .op-water { min-height: 56px; }
          .op-water strong { font-size: 1.2rem; }
          /* Aksi di bawah, selebar kartu: Validasi | Tolak | Detail. */
          .op-report-actions { grid-column: 1 / -1; }
          .op-report-actions .op-act { flex: 1 1 0; justify-content: center; min-width: 0; }
        }
      `}</style>
      <motion.div
        className="content"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Header halaman */}
        <motion.div variants={itemVariants} className="dash-head">
          <div>
            <h1>Validasi &amp; Pemantauan</h1>
            <p>Tinjau laporan warga dan pantau prediksi rob di {operatorArea}.</p>
          </div>
          <button type="button" className="dash-refresh" onClick={() => void loadReports(pageRef.current)} title="Muat ulang data sekarang">
            <span className="dash-live-dot" aria-hidden="true" />
            {lastUpdated
              ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · otomatis tiap 30 detik`
              : "Memuat data…"}
            <Icon name="refresh" />
          </button>
        </motion.div>

        {/* Strip status antrean: tenang saat kosong, menonjol saat ada laporan */}
        <motion.div variants={itemVariants} className={`dash-status ${pendingCount > 0 ? "busy" : "calm"}`} role="status">
          <span className="dash-status-icon"><Icon name={pendingCount > 0 ? "pending_actions" : "task_alt"} /></span>
          <div className="dash-status-text">
            <strong>
              {pendingCount > 0
                ? `${pendingCount.toLocaleString("id-ID")} laporan menunggu validasi`
                : "Tidak ada laporan yang menunggu validasi"}
            </strong>
            <span>
              {pendingCount > 0
                ? (triageCountOnPage > 0
                    ? `${triageCountOnPage} laporan di halaman ini berada di luar wilayah pantauan rob — periksa lokasinya.`
                    : "Utamakan laporan dengan tingkat keparahan Sangat Parah dan SLA terlambat.")
                : "Laporan warga baru akan muncul di sini dan memberi notifikasi otomatis."}
            </span>
          </div>
          {pendingCount > 0 && (
            <button
              type="button"
              className="dash-status-btn"
              onClick={() => queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              Tinjau antrean <Icon name="arrow_downward" style={{ fontSize: 17 }} />
            </button>
          )}
        </motion.div>

        {/* KPI Grid */}
        <motion.div variants={containerVariants} className="dash-kpis">
          {[
            { title: "Kelurahan dipantau", val: summary.monitored_villages, sub: "wilayah pesisir aktif", icon: "location_city", color: "var(--ocean-dark)", alert: false },
            { title: "Risiko sangat tinggi", val: summary.critical_villages, sub: "kelurahan, prediksi hari ini", icon: "warning", color: riskColors.sangat_tinggi, alert: summary.critical_villages > 0 },
            { title: "Menunggu validasi", val: summary.pending_reports, sub: "laporan warga", icon: "pending_actions", color: "#d97706", alert: summary.pending_reports > 0 },
            { title: "Divalidasi bulan ini", val: summary.monthly_validations, sub: "laporan disetujui", icon: "verified", color: riskColors.rendah, alert: false },
          ].map((kpi, idx) => (
            <motion.div
              key={kpi.title}
              variants={itemVariants}
              className="dash-kpi"
              style={{ ["--kpi-color" as string]: kpi.color }}
            >
              <div className="dash-kpi-top">
                <span className="dash-kpi-label">{kpi.title}</span>
                <span className="dash-kpi-icon"><Icon name={kpi.icon} /></span>
              </div>
              <motion.strong
                className={kpi.alert ? "dash-kpi-value is-alert" : "dash-kpi-value"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.06 }}
              >
                {kpi.val.toLocaleString("id-ID")}
              </motion.strong>
              <span className="dash-kpi-sub">{kpi.sub}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Layout */}
        <motion.div variants={itemVariants} className="dashboard-split-layout">
          {/* Antrean Moderasi */}
          <div className="panel flush" ref={queueRef} style={{ scrollMarginTop: 16 }}>
            <div className="op-panel-head">
              <div className="op-tabs" role="tablist" aria-label="Tampilan laporan">
                <button
                  type="button" role="tab" aria-selected={activeTab === "antrean"}
                  className={`op-tab ${activeTab === "antrean" ? "active" : ""}`}
                  onClick={() => setActiveTab("antrean")}
                >
                  Laporan Masuk
                  {pendingCount > 0 && <span className="op-tab-count">{pendingCount}</span>}
                </button>
                <button
                  type="button" role="tab" aria-selected={activeTab === "riwayat"}
                  className={`op-tab ${activeTab === "riwayat" ? "active" : ""}`}
                  onClick={() => { setActiveTab("riwayat"); setSlaOverdue(false); }}
                >
                  Riwayat Validasi
                </button>
              </div>
              <span className="op-subtitle">
                {operatorArea} · {pageMeta.total === 0 ? "tidak ada laporan pada filter ini" : `menampilkan ${pageMeta.from}-${pageMeta.to} dari ${pageMeta.total} laporan`}
                {(severityFilter || slaOverdue) && <> · <button type="button" onClick={() => { setSeverityFilter(""); setSlaOverdue(false); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, padding: 0, fontWeight: 600 }}>reset filter</button></>}
              </span>
              <div className="op-filter-row">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as ReportSeverity | "")}
                  aria-label="Filter keparahan laporan"
                  className="op-filter-select"
                >
                  <option value="">Semua keparahan</option>
                  <option value="sangat_parah">Sangat parah</option>
                  <option value="parah">Parah</option>
                  <option value="sedang">Sedang</option>
                  <option value="ringan">Ringan</option>
                </select>
                {/* Filter SLA hanya relevan untuk antrean terbuka — backend
                    mengecualikan laporan selesai dari sla=overdue, jadi
                    kombinasi Riwayat+SLA selalu kosong dan menyesatkan. */}
                {activeTab === "antrean" && (
                <button
                  type="button"
                  className={`op-filter-btn ${slaOverdue ? "active" : ""}`}
                  aria-pressed={slaOverdue}
                  onClick={() => setSlaOverdue((v) => !v)}
                >
                  <Icon name="schedule" style={{ fontSize: 18 }} /> <span className="op-btn-label">SLA<span className="op-btn-suffix"> terlambat</span></span>
                </button>
                )}
                <motion.button whileHover={{ y: -1 }} type="button" className="op-filter-btn export" onClick={handleExport}>
                  <Icon name="download" style={{ fontSize: 18 }} /> <span className="op-btn-label">Export<span className="op-btn-suffix"> CSV</span></span>
                </motion.button>
              </div>
            </div>

            <div className="report-list" style={{ border: "none", borderRadius: 0 }}>
              {isLoading ? (
                // Skeleton, sama seperti Admin/Riwayat/Audit — teks "Memuat…"
                // membuat daftar melompat tinggi begitu data datang.
                <div style={{ padding: "8px 16px" }}>
                  <LoadingBlock rows={5} rowHeight={72} label="Memuat laporan…" />
                </div>
              ) : reports.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="report-empty" style={{ textAlign: "center", padding: "64px 20px" }}>
                  {/* Pesan dibedakan per konteks — "Antrean Bersih" untuk hasil
                      filter kosong bisa dibaca "tidak ada tunggakan" padahal
                      hanya tersaring. */}
                  {severityFilter || slaOverdue ? (
                    <>
                      <Icon name="filter_alt_off" style={{ fontSize: "48px", color: "var(--ink-soft)", margin: "0 auto 16px" }} />
                      <strong>Tidak Ada yang Cocok</strong>
                      <span>Tidak ada laporan yang cocok dengan filter aktif. Coba longgarkan filternya.</span>
                    </>
                  ) : activeTab === "riwayat" ? (
                    <>
                      <Icon name="history" style={{ fontSize: "48px", color: "var(--ink-soft)", margin: "0 auto 16px" }} />
                      <strong>Belum Ada Riwayat</strong>
                      <span>Belum ada laporan yang divalidasi atau ditolak.</span>
                    </>
                  ) : (
                    <>
                      <Icon name="verified_user" style={{ fontSize: "48px", color: "var(--low)", margin: "0 auto 16px" }} />
                      <strong>Antrean Bersih</strong>
                      <span>Semua laporan telah diverifikasi.</span>
                    </>
                  )}
                </motion.div>
              ) : (
                <AnimatePresence>
                  {reports.map((report) => {
                    const ago = timeAgo(report.createdAt);
                    return (
                    <motion.div
                      key={report.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`op-report severity-left-${report.severity}`}
                      style={{ ["--sev" as string]: SEVERITY_COLOR[report.severity] }}
                    >
                      <div className="op-report-grid">
                        <div className={report.waterHeightCm ? "op-water" : "op-water none"} title="Tinggi air yang dilaporkan warga">
                          <strong>{report.waterHeightCm ?? "—"}</strong>
                          <span>{report.waterHeightCm ? "cm" : "tinggi air"}</span>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div className="op-report-title">
                            Kel. {report.village} <span>· Kec. {report.district}</span>
                          </div>
                          <div className="op-report-meta">
                            <code>{report.code}</code>
                            <span title={`Dilaporkan ${report.submittedAt}`}>
                              <Icon name="schedule" /> {ago || report.submittedAt}
                            </span>
                            {report.photos.length > 0 && (
                              <span><Icon name="photo_camera" /> {report.photos.length} foto</span>
                            )}
                          </div>
                          {report.description && <p className="op-report-text">{report.description}</p>}
                          <div className="op-report-tags">
                            <span className={`badge severity-${report.severity}`}>{severityLabels[report.severity]}</span>
                            {report.slaStatus === "terlambat" && (
                              <span className="op-chip late"><Icon name="timer_off" /> SLA terlambat</span>
                            )}
                            {!report.isWithinMonitoringArea && (
                              <span className="op-chip triage" title={`Lokasi di luar wilayah pantauan rob, tetapi masih dalam ${report.regency}.`}>
                                <Icon name="location_off" /> Di luar wilayah pantauan
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="op-report-actions">
                          {activeTab === "antrean" && (
                            <>
                              <button type="button" className="op-act validate" onClick={() => handleValidate(report)}>
                                <Icon name="check" /> Validasi
                              </button>
                              <button type="button" className="op-act reject" onClick={() => handleReject(report)}>
                                <Icon name="close" /> Tolak
                              </button>
                            </>
                          )}
                          <a href={`#/operator/reports/${report.id}`} className="op-act" aria-label={`Detail laporan ${report.code}`}>
                            <Icon name="visibility" /> Detail
                          </a>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {!isLoading && pageMeta.lastPage > 1 && (
              <nav className="operator-pagination" aria-label="Navigasi halaman antrean laporan">
                <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>Halaman {pageMeta.currentPage} dari {pageMeta.lastPage}</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button type="button" className="operator-page-btn" disabled={page <= 1} onClick={() => changePage(page - 1)} aria-label="Halaman sebelumnya">
                    <Icon name="chevron_left" />
                  </button>
                  {Array.from({ length: pageMeta.lastPage }, (_, i) => i + 1)
                    .filter((n) => pageMeta.lastPage <= 7 || n === 1 || n === pageMeta.lastPage || Math.abs(n - pageMeta.currentPage) <= 1)
                    .map((n, i, arr) => (
                      <span key={n} style={{ display: "contents" }}>
                        {i > 0 && n - arr[i - 1] > 1 && <span style={{ alignSelf: "center", padding: "0 3px" }}>…</span>}
                        <button type="button" className={`operator-page-btn ${n === pageMeta.currentPage ? "active" : ""}`} onClick={() => changePage(n)} aria-current={n === pageMeta.currentPage ? "page" : undefined}>{n}</button>
                      </span>
                    ))}
                  <button type="button" className="operator-page-btn" disabled={page >= pageMeta.lastPage} onClick={() => changePage(page + 1)} aria-label="Halaman berikutnya">
                    <Icon name="chevron_right" />
                  </button>
                </div>
              </nav>
            )}
          </div>

          {/* Status Kelurahan */}
          <div className="panel flush">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Status Kelurahan {operatorArea}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-soft)" }}>
                  Prediksi {summary.latest_prediction_date ? `per ${new Date(summary.latest_prediction_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}` : "terbaru"} · 25 kelurahan berisiko teratas.
                </p>
              </div>
              <motion.a whileHover={{ x: 4 }} href="#/map" style={{ fontSize: "0.9rem", color: "var(--ocean-dark)", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}><Icon name="map" /> Buka peta</motion.a>
            </div>
              <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <table className="data-table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-soft)" }}>
                  <th style={{ padding: "14px 24px", fontWeight: 600, color: "var(--ink-soft)", fontSize: "0.85rem" }}>Kecamatan / Kelurahan</th>
                  <th style={{ padding: "14px 24px", fontWeight: 600, color: "var(--ink-soft)", fontSize: "0.85rem" }}>Kelas risiko</th>
                  <th style={{ padding: "14px 24px", fontWeight: 600, color: "var(--ink-soft)", fontSize: "0.85rem", textAlign: "right" }}>Peluang rob</th>
                  {/* Nilainya regions.population apa adanya (semua kelas) — jangan
                      dilabeli "Pop. risiko" yang bermakna khusus tinggi+ di
                      dashboard provinsi. */}
                  <th style={{ padding: "14px 24px", fontWeight: 600, color: "var(--ink-soft)", fontSize: "0.85rem", textAlign: "right" }}>Populasi</th>
                </tr>
              </thead>
              <tbody>
                {summary.region_statuses.map((row, idx) => {
                  const color = riskColors[row.risk_class] ?? riskColors.rendah;
                  const label = riskLabels[row.risk_class] ?? row.risk_class;
                  const probability = Math.max(0, Math.min(100, Math.round(Number(row.risk_probability ?? 0))));
                  const population = Number(row.population ?? 0);
                  return (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + (idx * 0.03) }}
                    style={{ borderBottom: "1px solid var(--line)", ["--pill" as string]: color }}
                  >
                    <td style={{ padding: "14px 24px", fontWeight: 600 }}>{row.village ?? row.district ?? "Wilayah pantau"}<div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3, fontWeight: 400 }}>{row.district ?? "-"}, {row.regency ?? "-"}</div></td>
                    <td style={{ padding: "14px 24px" }}><span className="dash-pill"><i />{label}</span></td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <span className="dash-prob">
                        <span className="dash-prob-bar" aria-hidden="true"><span style={{ width: `${probability}%` }} /></span>
                        <b>{probability}%</b>
                      </span>
                    </td>
                    {/* 0/null = data populasi belum tersedia, bukan "tanpa penduduk". */}
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      {population > 0
                        ? population.toLocaleString("id-ID")
                        : <span className="dash-muted" title="Data populasi kelurahan ini belum tersedia">—</span>}
                    </td>
                  </motion.tr>
                );})}
                {summary.region_statuses.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: "16px 24px", color: "var(--ink-soft)" }}>Belum ada data prediksi untuk cakupan provinsi.</td></tr>
                )}
                </tbody>
              </table>
              </div>
          </div>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

