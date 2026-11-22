import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "../../shared/components/AppShell";
import { api, downloadFile, errorMessage } from "../../shared/api/client";
import { useToast } from "../../shared/components/Toast";
import { Icon } from "../../shared/components/Icon";
import { LoadingBlock } from "../../shared/components/LoadingBlock";
import { EmptyState } from "../../shared/components/EmptyState";
import { Skeleton } from "../../shared/components/Skeleton";
import { roleLabel } from "../../shared/constants/roles";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import "../dashboards/dashboardKit.css";
import "./adminScreens.css";

interface AuditLogData {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_resource: string | null;
  outcome: "success" | "fail" | "denied" | "partial";
  ip_address: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

interface AuditMeta {
  current_page: number;
  last_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface AuditSummary {
  total: number;
  success: number;
  denied: number;
  fail: number;
  partial: number;
}

interface AuditLogResponse {
  data: AuditLogData[];
  meta?: AuditMeta;
  summary?: AuditSummary;
}

const outcomes: Record<string, string> = {
  success: "Berhasil",
  fail: "Gagal",
  denied: "Ditolak",
  partial: "Sebagian",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, ease: "easeOut" } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// Label ramah untuk action string yang benar-benar dicatat backend
// (AuditService::write / EnsureRole / AuthenticateApiKey). Kunci harus PERSIS
// sama dengan yang disimpan, jika tidak label mentah yang tampil.
const actionLabels: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  register: "Registrasi Akun",
  create_report: "Membuat Laporan",
  validate_report: "Memvalidasi Laporan",
  reject_report: "Menolak Laporan",
  update_report_status: "Update Status Laporan",
  create_user: "Membuat Pengguna",
  approve_user: "Menyetujui Pengguna",
  reject_user: "Menolak Pengguna",
  update_user: "Ubah Data Pengguna",
  delete_user: "Hapus Pengguna",
  export_users: "Ekspor Pengguna",
  export_audit_logs: "Ekspor Log Audit",
  export_operator_reports: "Ekspor Laporan Operator",
  export_province_dashboard: "Ekspor Dashboard Provinsi",
  download_research_dataset: "Unduh Dataset Riset",
  regenerate_api_key: "Regenerasi API Key",
  api_key_request: "Permintaan API Key",
  access_denied: "Akses Ditolak",
  update_notification_settings: "Update Konfigurasi Notifikasi",
};

function formatTargetResource(target: string | null): string {
  if (!target) return "-";
  return target.replace("ground_truth_reports:", "ID Laporan: ")
               .replace("datasets:", "ID Dataset: ")
               .replace("users:", "ID Pengguna: ")
               .replace("api_keys:", "ID API Key: ");
}

export function AuditLogPage() {
  const toast = useToast();
  const reducedMotion = useReducedMotion();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<AuditMeta | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);

  // Filters
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");
  const [search, setSearch] = useState("");

  // Penanda urutan request agar respons kueri lama tidak menimpa hasil kueri
  // terbaru saat mengetik cepat di kotak pencarian.
  const fetchSeqRef = useRef(0);
  const fetchLogs = useCallback(() => {
    const seq = ++fetchSeqRef.current;
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams();
    if (action) query.append("action", action);
    if (outcome) query.append("outcome", outcome);
    if (search) query.append("search", search);
    query.append("page", String(page));

    api<AuditLogResponse>(`/admin/audit-logs?${query.toString()}`)
      .then((res) => {
        if (seq !== fetchSeqRef.current) return;
        setLogs(res.data);
        setMeta(res.meta ?? null);
        setSummary(res.summary ?? null);
        setLastUpdated(new Date());
      })
      .catch((err: unknown) => {
        if (seq !== fetchSeqRef.current) return;
        setLogs([]);
        setError(err instanceof Error ? err.message : "Log audit belum bisa dimuat.");
      })
      .finally(() => { if (seq === fetchSeqRef.current) setIsLoading(false); });
  }, [action, outcome, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Ubah filter → kembali ke halaman 1 (setPage(1) tanpa efek ganda saat sudah di 1).
  const onFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const changePage = (next: number) => {
    if (!meta || next < 1 || next > meta.last_page || next === page) return;
    setPage(next);
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString("id-ID", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const handleExportAudit = async () => {
    try {
      await downloadFile("/admin/audit-logs", "audit_logs.csv", { action, outcome, search, format: "csv" });
      toast.success("Export audit log berhasil diunduh.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal export audit log."));
    }
  };

  const kpis = [
    { title: "Total catatan", val: summary?.total ?? 0, sub: "aktivitas tercatat", icon: "history", color: "var(--ocean-dark)", alert: false },
    { title: "Aktivitas berhasil", val: summary?.success ?? 0, sub: "permintaan berhasil diproses", icon: "task_alt", color: "var(--low)", alert: false },
    { title: "Akses ditolak", val: summary?.denied ?? 0, sub: "permintaan tanpa izin akses", icon: "block", color: "var(--critical)", alert: (summary?.denied ?? 0) > 0 },
    { title: "Gagal / sebagian", val: (summary?.fail ?? 0) + (summary?.partial ?? 0), sub: "aktivitas perlu diperiksa", icon: "error_outline", color: "var(--amber)", alert: (summary?.fail ?? 0) + (summary?.partial ?? 0) > 0 },
  ];
  const hasFilters = Boolean(action || outcome || search);
  const resetFilters = () => { setAction(""); setOutcome(""); setSearch(""); setPage(1); };

  const pageNumbers = meta
    ? Array.from({ length: meta.last_page }, (_, i) => i + 1).filter(
        (n) => meta.last_page <= 7 || n === 1 || n === meta.last_page || Math.abs(n - meta.current_page) <= 1,
      )
    : [];

  return (
    <AppShell active="audit" title="Audit Log Aktivitas">

      <motion.div variants={containerVariants} initial={reducedMotion ? false : "hidden"} animate="show" className="content admin-screen">
        <div className="dash-head">
          <div><h1>Audit Aktivitas</h1><p>Telusuri aktivitas pengguna, perubahan data, dan hasil permintaan akses sistem.</p></div>
          <button type="button" className="dash-refresh" disabled={isLoading} onClick={fetchLogs} title="Muat ulang catatan audit">
            <Icon name="refresh" />{isLoading ? "Memuat data…" : lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Muat ulang data"}
          </button>
        </div>

        {/* KPI Grid */}
        <motion.div variants={itemVariants} className="dash-kpis">
          {kpis.map((kpi) => (
            <div key={kpi.title} className="dash-kpi" style={{ ["--kpi-color" as string]: kpi.color }}>
              <div className="dash-kpi-top"><span className="dash-kpi-label">{kpi.title}</span><span className="dash-kpi-icon"><Icon name={kpi.icon} /></span></div>
              {isLoading && !lastUpdated ? <Skeleton width={70} height={34} borderRadius={6} /> : <strong className={`dash-kpi-value${kpi.alert ? " is-alert" : ""}`}>{kpi.val.toLocaleString("id-ID")}</strong>}
              <span className="dash-kpi-sub">{kpi.sub}</span>
            </div>
          ))}
        </motion.div>

          {/* Filter Bar */}
          <div className="admin-toolbar" role="search" aria-label="Filter audit">
            <div className="admin-filter-field admin-filter-search">
              <label htmlFor="audit-search">Cari aktivitas</label>
              <div className="admin-search-input"><Icon name="search" /><input id="audit-search" type="text" placeholder="Nama aktor atau target…" maxLength={100} value={search} onChange={(e) => onFilterChange(setSearch)(e.target.value)} /></div>
            </div>
            <div className="admin-filter-field">
              <label htmlFor="audit-action">Jenis aktivitas</label>
            <select
              id="audit-action"
              value={action}
              onChange={(e) => onFilterChange(setAction)(e.target.value)}
            >
              <option value="">Semua aktivitas</option>
              {Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            </div>
            <div className="admin-filter-field">
              <label htmlFor="audit-outcome">Hasil aktivitas</label>
            <select
              id="audit-outcome"
              value={outcome}
              onChange={(e) => onFilterChange(setOutcome)(e.target.value)}
            >
              <option value="">Semua hasil</option>
              <option value="success">Berhasil</option>
              <option value="fail">Gagal</option>
              <option value="denied">Ditolak</option>
              <option value="partial">Sebagian</option>
            </select>
            </div>
            {hasFilters && <button type="button" className="admin-reset" onClick={resetFilters}><Icon name="restart_alt" /> Atur ulang</button>}
          </div>

        <motion.section variants={itemVariants} className="panel flush admin-data-panel" aria-labelledby="audit-title" aria-busy={isLoading}>
          <div className="admin-section-head">
            <div><h2 id="audit-title">Jejak aktivitas sistem</h2><p>{isLoading ? "Memuat catatan aktivitas…" : `${(meta?.total ?? logs.length).toLocaleString("id-ID")} catatan${hasFilters ? " sesuai filter" : " tersedia"}`}</p></div>
            <button type="button" className="admin-action" onClick={handleExportAudit}><Icon name="download" /> Ekspor CSV</button>
          </div>
          {/* Audit Logs Table */}
          <div>
            {isLoading ? (
              <div style={{ padding: "16px 24px" }}><LoadingBlock rows={6} label="Memuat log audit…" /></div>
            ) : error ? (
              <div style={{ padding: "56px 20px", textAlign: "center", color: "var(--ink-soft)", display: "grid", justifyItems: "center", gap: 4 }}>
                <Icon name="error" style={{ fontSize: 48, color: "var(--critical)", opacity: 0.85, marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Gagal memuat log</div>
                <div style={{ fontSize: 13, margin: "0 0 12px" }}>{error}</div>
                <button type="button" className="btn secondary" onClick={fetchLogs}><Icon name="refresh" /> Coba lagi</button>
              </div>
            ) : logs.length === 0 ? (
              <EmptyState
                icon="history_toggle_off"
                title="Log kosong"
                description="Tidak ada log aktivitas yang cocok dengan filter pencarian."
              />
            ) : (
            <div>
              <table className="data-table admin-data-table audit-table" aria-label="Catatan audit aktivitas">
                <colgroup><col style={{ width: "17%" }} /><col style={{ width: "23%" }} /><col style={{ width: "24%" }} /><col style={{ width: "23%" }} /><col style={{ width: "13%" }} /></colgroup>
                <thead>
                  <tr>
                    <th scope="col">Waktu kejadian</th><th scope="col">Aktor</th><th scope="col">Aktivitas</th><th scope="col">Target</th><th scope="col" className="admin-table-end">Hasil</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={reducedMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="admin-audit-time" data-label="Waktu kejadian"><time dateTime={log.created_at}>{formatDate(log.created_at)}</time></td>
                      <td className="admin-audit-actor" data-label="Aktor">
                        <div className="admin-user-name">{log.actor_name}</div>
                        <span className="admin-role-badge">
                          {roleLabel(log.actor_role)}
                        </span>
                      </td>
                      <td data-label="Aktivitas" className="admin-audit-action">
                        <span className="admin-activity-label">
                          {actionLabels[log.action] || log.action}
                        </span>
                      </td>
                      <td className="admin-audit-target" data-label="Target">
                        {formatTargetResource(log.target_resource)}
                      </td>
                      <td className="admin-table-end admin-audit-outcome" data-label="Hasil">
                        <span className={`admin-status-badge outcome-${log.outcome}`}><i />
                          {outcomes[log.outcome] || log.outcome}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && !error && meta && (
            <nav className="audit-pagination" aria-label="Navigasi halaman log audit">
              <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>
                Menampilkan {meta.from ?? 0}–{meta.to ?? 0} dari {meta.total} entri
              </span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" className="audit-page-btn" disabled={page <= 1} onClick={() => changePage(page - 1)} aria-label="Halaman sebelumnya">
                  <Icon name="chevron_left" />
                </button>
                {pageNumbers.map((n, i) => (
                  <span key={n} style={{ display: "contents" }}>
                    {i > 0 && n - pageNumbers[i - 1] > 1 && <span style={{ alignSelf: "center", padding: "0 3px" }}>…</span>}
                    <button type="button" className={`audit-page-btn ${n === meta.current_page ? "active" : ""}`} onClick={() => changePage(n)} aria-current={n === meta.current_page ? "page" : undefined}>{n}</button>
                  </span>
                ))}
                <button type="button" className="audit-page-btn" disabled={page >= meta.last_page} onClick={() => changePage(page + 1)} aria-label="Halaman berikutnya">
                  <Icon name="chevron_right" />
                </button>
              </div>
            </nav>
          )}
        </motion.section>
      </motion.div>
    </AppShell>
  );
}
