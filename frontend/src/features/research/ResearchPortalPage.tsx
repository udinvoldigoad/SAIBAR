import { useEffect, useState } from "react";
import { AppShell } from "../../shared/components/AppShell";
import { api, apiUrl, errorMessage } from "../../shared/api/client";
import { useToast } from "../../shared/components/Toast";
import { Icon } from "../../shared/components/Icon";
import { LoadingBlock } from "../../shared/components/LoadingBlock";
import { EmptyState } from "../../shared/components/EmptyState";
import { Skeleton } from "../../shared/components/Skeleton";
import { InlineNotice } from "../../shared/components/InlineNotice";
import { getCurrentUser } from "../../shared/auth/session";
import { motion, useReducedMotion } from "framer-motion";
import "../dashboards/dashboardKit.css";
import "./researchPortal.css";

interface DatasetData {
  id: string;
  name: string;
  description: string;
  dataset_type: string;
  period_start: string;
  period_end: string;
  resolution: string;
  record_count: number;
  license: string;
  csv_url: string;
  json_url: string;
  coverage_regencies: string[] | null;
}

interface ApiKeyData {
  id: string;
  key_prefix: string;
  status: string;
  created_at: string;
}

interface DatasetResponse {
  data: DatasetData[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    available_regencies?: string[];
  };
}

interface ApiKeyResponse {
  data: ApiKeyData[];
}

interface RegenerateKeyResponse {
  message: string;
  raw_key: string;
}

interface ResearchStats {
  dataset_count: number;
  total_records: number;
  downloads_this_month: number;
  api_calls_today: number;
  active_api_keys: number;
}

interface ResearchStatsResponse { data: ResearchStats; }

interface EndpointUsage {
  endpoint: string;
  total: number;
  success: number;
  failed: number;
}

interface DayUsage {
  day: string;
  total: number;
  failed: number;
}

interface UsageResponse {
  data: {
    window_days: number;
    since: string;
    total_calls: number;
    per_endpoint: EndpointUsage[];
    per_day: DayUsage[];
  };
}

interface ApiEndpointDoc {
  method: string;
  path: string;
  description: string;
  scope: string;
  query: Record<string, string>;
  example_request?: string;
  example_response?: unknown;
}

interface ApiReferenceResponse {
  data: {
    base_path: string;
    authentication: { header: string; alternative: string };
    rate_limit?: { per_minute: number; scope: string; headers: string[]; note: string };
    error_format?: { shape: Record<string, unknown>; codes: Record<string, string> };
    endpoints: ApiEndpointDoc[];
    license_note: string;
  };
}

// Periode dataset disimpan sebagai ISO UTC (mis. 2020-01-01T00:00:00Z). Ditampilkan
// ringkas "1 Jan 2020 – 31 Des 2025"; timeZone UTC agar tanggal tak bergeser.
const periodDateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function formatPeriodDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : periodDateFormatter.format(date);
}

export function ResearchPortalPage() {
  const toast = useToast();
  const reducedMotion = useReducedMotion();
  const currentUser = getCurrentUser();
  const isResearcher = currentUser?.role === "peneliti";
  const [datasets, setDatasets] = useState<DatasetData[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [rawGeneratedKey, setRawGeneratedKey] = useState<string | null>(null);
  const [isRegenerating, setRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [stats, setStats] = useState<ResearchStats>({ dataset_count: 0, total_records: 0, downloads_this_month: 0, api_calls_today: 0, active_api_keys: 0 });
  const [apiReference, setApiReference] = useState<ApiReferenceResponse["data"] | null>(null);
  const [usage, setUsage] = useState<UsageResponse["data"] | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [datasetFilters, setDatasetFilters] = useState({ year: "", type: "", search: "", regency: "" });
  const [datasetPage, setDatasetPage] = useState(1);
  const [datasetMeta, setDatasetMeta] = useState<DatasetResponse["meta"] | null>(null);
  const [availableRegencies, setAvailableRegencies] = useState<string[]>([]);
  const [allDatasetTypes, setAllDatasetTypes] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const datasetDownloadUrl = (dataset: DatasetData, format: "csv" | "json" | "xlsx") => (
    apiUrl(`/api/research/datasets/${dataset.id}/download?format=${format}`)
  );

  const handleDatasetDownload = async (dataset: DatasetData, format: "csv" | "json" | "xlsx") => {
    try {
      const response = await fetch(datasetDownloadUrl(dataset, format), {
        headers: {
          Accept: format === "csv" ? "text/csv" : format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/json",
        },
      });
      if (!response.ok) throw new Error(`Download gagal (${response.status})`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${dataset.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(`Dataset ${format.toUpperCase()} mulai diunduh.`);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal mengunduh dataset."));
    }
  };

  const loadResearchData = async (page = datasetPage, overrideFilters = datasetFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "10", page: String(page) });
      if (overrideFilters.year) params.set("year", overrideFilters.year);
      if (overrideFilters.type) params.set("type", overrideFilters.type);
      if (overrideFilters.regency) params.set("regency", overrideFilters.regency);
      if (overrideFilters.search.trim()) params.set("search", overrideFilters.search.trim());

      const dsRes = await api<DatasetResponse>(`/research/datasets?${params.toString()}`);
      setDatasets(dsRes.data);
      setDatasetMeta(dsRes.meta ?? null);
      if (dsRes.meta?.available_regencies) setAvailableRegencies(dsRes.meta.available_regencies);
      setAllDatasetTypes((prev) => Array.from(new Set([...prev, ...dsRes.data.map((item) => item.dataset_type)])).sort());

      if (isResearcher) {
        const [keysRes, statsRes, refRes] = await Promise.all([
          api<ApiKeyResponse>("/research/api-keys"),
          api<ResearchStatsResponse>("/research/stats"),
          api<ApiReferenceResponse>("/research/api-reference"),
        ]);
        setApiKeys(keysRes.data);
        setStats(statsRes.data);
        setApiReference(refRes.data);
      } else {
        // admin juga boleh membaca /research/stats — dulu KPI mereka dihitung
        // dari 10 baris halaman aktif dan unduhan/API dibiarkan "0" hardcoded
        // seolah fakta.
        const statsRes = await api<ResearchStatsResponse>("/research/stats");
        setStats(statsRes.data);
      }
      setLastUpdated(new Date());
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal memuat portal penelitian."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResearchData();
  }, []);

  const loadUsage = async () => {
    if (!isResearcher) return;
    setUsageLoading(true);
    try {
      const res = await api<UsageResponse>("/research/usage");
      setUsage(res.data);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal memuat statistik penggunaan API."));
    } finally {
      setUsageLoading(false);
    }
  };

  // Muat statistik penggunaan saat tab "Penggunaan API" dibuka pertama kali.
  useEffect(() => {
    if (activeTab === 2 && isResearcher && !usage && !usageLoading) {
      loadUsage();
    }
  }, [activeTab]);

  // Tak ada gerbang izin di sini lagi: izin diminta SEKALI saat akun peneliti
  // dibuat (research_purpose wajib, akun ditahan `menunggu` sampai admin
  // menyetujui). Peneliti yang sampai ke halaman ini sudah pernah ditinjau.
  const handleRegenerateKey = async () => {
    if (isRegenerating) return;
    setRegenerating(true);
    try {
      const res = await api<RegenerateKeyResponse>("/research/api-keys", {
        method: "POST",
      });
      setRawGeneratedKey(res.raw_key);
      toast.success("API key baru berhasil dibuat! Segera salin kunci Anda.");

      const keysRes = await api<ApiKeyResponse>("/research/api-keys");
      setApiKeys(keysRes.data);
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal meregenerasi API key."));
    } finally {
      setRegenerating(false);
    }
  };

  // Salin hanya berlaku untuk raw key yang baru dibuat (kunci penuh tampil sekali).
  const handleCopyKey = async () => {
    if (!rawGeneratedKey) return;
    try {
      await navigator.clipboard.writeText(rawGeneratedKey);
      toast.success("API key disalin ke clipboard.");
    } catch {
      toast.error("Gagal menyalin otomatis. Salin manual dari layar.");
    }
  };

  const activeKey = apiKeys.find((k) => k.status === "aktif");
  const availableYears = ["2026", "2025", "2024", "2023", "2022", "2021", "2020"];
  // Akumulasi jenis dari semua halaman yang pernah dimuat — bila diturunkan
  // dari hasil terfilter saja, memilih satu jenis membuat dropdown menyusut
  // jadi jenis itu sendiri dan user tak bisa pindah tanpa Reset.
  const availableTypes = allDatasetTypes;
  const applyDatasetFilters = () => {
    setDatasetPage(1);
    loadResearchData(1);
  };
  // Ubah satu filter select lalu langsung terapkan (pakai nilai baru, bukan state basi).
  const changeDatasetFilter = (patch: Partial<typeof datasetFilters>) => {
    const next = { ...datasetFilters, ...patch };
    setDatasetFilters(next);
    setDatasetPage(1);
    loadResearchData(1, next);
  };
  const resetDatasetFilters = () => {
    const cleared = { year: "", type: "", search: "", regency: "" };
    setDatasetFilters(cleared);
    setDatasetPage(1);
    loadResearchData(1, cleared);
  };
  const hasDatasetFilters = Boolean(datasetFilters.year || datasetFilters.type || datasetFilters.regency || datasetFilters.search.trim());
  const changeDatasetPage = (nextPage: number) => {
    if (datasetMeta && (nextPage < 1 || nextPage > datasetMeta.last_page)) return;
    setDatasetPage(nextPage);
    loadResearchData(nextPage);
  };

  // Daftar kunci belum termuat pada render pertama — tampilkan skeleton supaya
  // tombolnya tak sempat salah berlabel "Buat Kunci" padahal kunci sudah ada.
  const credentialLoading = isResearcher && isLoading && apiKeys.length === 0;
  const keyButtonLabel = activeKey || rawGeneratedKey ? "Regenerasi" : "Buat Kunci";
  const tabs = isResearcher
    ? [{ label: "Arsip data", icon: "database" }, { label: "Referensi API", icon: "code" }, { label: "Penggunaan API", icon: "monitoring" }, { label: "Lisensi data", icon: "gavel" }]
    : [{ label: "Arsip data", icon: "database" }, { label: "Lisensi data", icon: "gavel" }];

  return (
    <AppShell active="research" title={isResearcher ? "Arsip & API Peneliti" : "Arsip Data Provinsi"}>
      <div className="content research-portal">
        <div className="dash-head">
          <div>
            <h1>Arsip Data Lampung</h1>
            <p>Telusuri data pasang surut, laporan tervalidasi, dan prediksi rob untuk penelitian.</p>
          </div>
          <button type="button" className="dash-refresh" disabled={isLoading} onClick={() => void loadResearchData()} title="Muat ulang data sekarang">
            <Icon name="refresh" />
            {isLoading ? "Memuat data…" : lastUpdated
              ? `Diperbarui ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`
              : "Muat ulang data"}
          </button>
        </div>
        
        {/* API Key Management Header row */}
        {isResearcher && <div className="cred-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", background: "var(--surface)", padding: "16px 24px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}>
          <div className="cred-card-info" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--ocean-light)", color: "var(--ocean-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="vpn_key" style={{ fontSize: "20px" }} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>Kunci akses API</div>
              {credentialLoading ? (
                <Skeleton width={220} height={14} borderRadius={6} style={{ marginTop: 6 }} />
              ) : rawGeneratedKey ? (
                <>
                  <div style={{ fontSize: "13px", color: "var(--ink)", fontFamily: "monospace", marginTop: "2px", wordBreak: "break-all" }}>{rawGeneratedKey}</div>
                  <p className="rp-key-hint">Kunci penuh hanya tampil sekali. Salin dan simpan sekarang.</p>
                </>
              ) : activeKey ? (
                <div>
                  <code className="rp-key-prefix">{activeKey.key_prefix}…</code>
                  <p className="rp-key-hint">Regenerasi akan mengganti kunci ini dan mencabut akses kunci lama.</p>
                </div>
              ) : (
                <p className="rp-key-hint">Buat kunci untuk mengakses API penelitian.</p>
              )}
            </div>
          </div>
          <div className="cred-card-actions" style={{ display: "flex", gap: "8px" }}>
            {credentialLoading ? (
              <Skeleton width={130} height={38} borderRadius={10} />
            ) : (
            <>
            {rawGeneratedKey && (
              <button type="button" className="rp-key-action" onClick={handleCopyKey}>
                <Icon name="content_copy" style={{ fontSize: "16px" }} /> Salin Kunci
              </button>
            )}
            <button
              type="button"
              className={`rp-key-action${activeKey || rawGeneratedKey ? "" : " primary"}`}
              disabled={isRegenerating}
              onClick={handleRegenerateKey}
            >
              <Icon name={isRegenerating ? "hourglass_top" : "refresh"} /> {isRegenerating ? "Memproses…" : keyButtonLabel}
            </button>
            </>
            )}
          </div>
        </div>}

        {/* KPI Grid */}
        <style>{`
          /* Kartu Kredensial API menumpuk & rapi di mobile (hindari teks kunci
             menempel ke tombol). Tombol jadi lebar penuh, mudah ditekan. */
          .cred-card-info { min-width: 0; }
          .cred-card-info > div:last-child { min-width: 0; }
          .cred-card-actions { flex-shrink: 0; }
          @media (max-width: 640px) {
            .cred-card { flex-direction: column; align-items: stretch !important; gap: 14px; padding: 16px !important; }
            .cred-card-info { align-items: flex-start !important; }
            .cred-card-actions { width: 100%; }
            .cred-card-actions .rp-key-action { flex: 1; justify-content: center; }
            .cred-card-actions .skeleton { width: 100% !important; }
          }

          /* Chip kode inline yang rapi — override rule global 'code' (inline-block
             dengan margin/padding besar) yang membuat teks terpisah berantakan. */
          .api-ref code, .api-inline-code { display: inline-block; margin: 0; border: 0; overflow-x: visible; vertical-align: baseline; background: var(--surface-muted); color: var(--ink); padding: 2px 7px; border-radius: 5px; font-size: 12px; font-family: monospace; word-break: break-word; }
          .api-step-codes { margin-top: 8px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
          .api-step-codes span { font-size: 12.5px; color: var(--ink-soft); }
          .api-error-codes { display: grid; gap: 10px; }
          .api-error-row { display: flex; align-items: baseline; gap: 10px; }
          .api-error-row code { flex-shrink: 0; font-weight: 700; color: var(--critical); }
          .api-error-row span { font-size: 13px; color: var(--ink-soft); line-height: 1.5; }

        `}</style>
        <div className="dash-kpis">
          {[
            { title: "Dataset tersedia", val: (stats.dataset_count || datasets.length).toLocaleString("id-ID"), sub: "katalog data penelitian", icon: "database", color: "var(--ocean-dark)" },
            { title: "Total rekaman", val: stats.total_records.toLocaleString("id-ID"), sub: "baris data terdokumentasi", icon: "table_rows", color: "var(--ocean-dark)" },
            { title: "Unduhan bulan ini", val: stats.downloads_this_month.toLocaleString("id-ID"), sub: "permintaan ekspor data", icon: "download", color: "var(--low)" },
            { title: "Panggilan API hari ini", val: stats.api_calls_today.toLocaleString("id-ID"), sub: `${stats.active_api_keys.toLocaleString("id-ID")} kunci API aktif`, icon: "data_object", color: "var(--ocean-dark)" }
          ].map((kpi) => (
            <div key={kpi.title} className="dash-kpi" style={{ ["--kpi-color" as string]: kpi.color }}>
              <div className="dash-kpi-top">
                <span className="dash-kpi-label">{kpi.title}</span>
                <span className="dash-kpi-icon"><Icon name={kpi.icon} /></span>
              </div>
              {isLoading && !lastUpdated
                ? <Skeleton width={85} height={34} borderRadius={6} />
                : <strong className="dash-kpi-value">{kpi.val}</strong>}
              <span className="dash-kpi-sub">{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* Tabs Navigation */}
        <nav className="rp-tabs" aria-label="Bagian arsip data">
          {tabs.map((tab, idx) => (
            <button type="button"
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className={`rp-tab${activeTab === idx ? " active" : ""}`}
              aria-pressed={activeTab === idx}
            >
              <Icon name={tab.icon} />{tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div style={{ minHeight: "400px" }}>
          
          {/* Tab 0: Arsip Data */}
          {activeTab === 0 && (
            <motion.div initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Filters */}
              <div className="rp-filter" role="search" aria-label="Filter dataset">
                <div className="rp-field rp-search">
                  <label htmlFor="rp-search">Cari dataset</label>
                  <div className="rp-search-controls">
                  <div className="rp-search-field">
                    <Icon name="search" className="rp-search-ic" />
                    <input
                      type="text"
                      id="rp-search"
                      value={datasetFilters.search}
                      onChange={(event) => setDatasetFilters((current) => ({ ...current, search: event.target.value }))}
                      onKeyDown={(event) => { if (event.key === "Enter") applyDatasetFilters(); }}
                      placeholder="Cari nama dataset…"
                      aria-label="Cari dataset"
                    />
                    {datasetFilters.search && (
                      <button type="button" className="rp-search-clear" aria-label="Bersihkan pencarian" onClick={() => changeDatasetFilter({ search: "" })}>
                        <Icon name="close" style={{ fontSize: 16 }} />
                      </button>
                    )}
                  </div>
                  <button type="button" className="rp-search-go" onClick={applyDatasetFilters}>
                    <Icon name="search" /> Cari
                  </button>
                  </div>
                </div>
                <div className="rp-field">
                  <label htmlFor="rp-year">Tahun</label>
                  <select id="rp-year" className="rp-select" value={datasetFilters.year} onChange={(event) => changeDatasetFilter({ year: event.target.value })}>
                    <option value="">Semua tahun</option>
                    {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
                <div className="rp-field">
                  <label htmlFor="rp-regency">Kabupaten/kota</label>
                  <select id="rp-regency" className="rp-select" value={datasetFilters.regency} onChange={(event) => changeDatasetFilter({ regency: event.target.value })}>
                    <option value="">Semua wilayah</option>
                    {availableRegencies.map((regency) => <option key={regency} value={regency}>{regency}</option>)}
                  </select>
                </div>
                <div className="rp-field">
                  <label htmlFor="rp-type">Jenis dataset</label>
                  <select id="rp-type" className="rp-select" value={datasetFilters.type} onChange={(event) => changeDatasetFilter({ type: event.target.value })}>
                    <option value="">Semua jenis</option>
                    {availableTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                {hasDatasetFilters && (
                  <button type="button" className="rp-reset" onClick={resetDatasetFilters}>
                    <Icon name="restart_alt" /> Atur ulang
                  </button>
                )}
              </div>

              {/* Table */}
              <section className="panel flush rp-catalog" aria-labelledby="rp-catalog-title" aria-busy={isLoading}>
                <div className="rp-catalog-head">
                  <div>
                    <h2 id="rp-catalog-title">Katalog dataset</h2>
                    <p>Periksa periode dan resolusi data, lalu pilih format unduhan.</p>
                  </div>
                  <span className="rp-result-count" role="status">{isLoading ? "Memuat…" : `${(datasetMeta?.total ?? datasets.length).toLocaleString("id-ID")} dataset${hasDatasetFilters ? " ditemukan" : " tersedia"}`}</span>
                </div>
                <table className="data-table rp-dataset-table" aria-label="Katalog dataset penelitian">
                  <colgroup><col className="rp-col-dataset" /><col className="rp-col-period" /><col className="rp-col-records" /><col className="rp-col-download" /></colgroup>
                  <thead>
                    <tr>
                      <th scope="col">Dataset</th>
                      <th scope="col">Periode data</th>
                      <th scope="col" className="rp-records">Rekaman</th>
                      <th scope="col" className="rp-download-cell">Unduh data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((ds) => (
                      <tr key={ds.id}>
                        <td className="rp-dataset-info">
                          <div className="rp-dataset-name">{ds.name}</div>
                          <p className="rp-dataset-description">{ds.description}</p>
                          <div className="rp-dataset-meta">
                            <span className="rp-type-badge">{ds.dataset_type}</span>
                            <span className="rp-resolution"><Icon name="schedule" />{ds.resolution}</span>
                          </div>
                        </td>
                        <td className="rp-period" data-label="Periode data">
                          <span>{formatPeriodDate(ds.period_start)}</span>
                          <span className="rp-period-end">s.d. {formatPeriodDate(ds.period_end)}</span>
                        </td>
                        <td className="rp-records" data-label="Rekaman">
                          <strong className="dash-num">{ds.record_count.toLocaleString("id-ID")}</strong>
                          <span className="rp-records-unit">baris data</span>
                        </td>
                        <td className="rp-download-cell">
                          <div className="rp-downloads" role="group" aria-label={`Unduh ${ds.name}`}>
                            <button type="button" onClick={() => handleDatasetDownload(ds, "csv")} className="rp-download primary" title={`Unduh ${ds.name} sebagai CSV`}>
                              <Icon name="download" /> CSV
                            </button>
                            <button type="button" onClick={() => handleDatasetDownload(ds, "xlsx")} className="rp-download" title={`Unduh ${ds.name} sebagai Excel`}>
                              Excel
                            </button>
                            <button type="button" onClick={() => handleDatasetDownload(ds, "json")} className="rp-download" title={`Unduh ${ds.name} sebagai JSON`}>
                              JSON
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {isLoading && (
                      <tr className="rp-state-row">
                        <td colSpan={4}><LoadingBlock rows={4} label="Memuat dataset…" /></td>
                      </tr>
                    )}
                    {datasets.length === 0 && !isLoading && (
                      <tr className="rp-state-row">
                        <td colSpan={4}>
                          <EmptyState compact icon="database" title={hasDatasetFilters ? "Dataset tidak ditemukan" : "Belum ada dataset"} description={hasDatasetFilters ? "Coba kata kunci lain atau atur ulang filter untuk melihat semua dataset." : "Dataset akan tampil di sini setelah tersedia dalam katalog."} />
                          {hasDatasetFilters && <button type="button" className="rp-empty-reset rp-reset" onClick={resetDatasetFilters}><Icon name="restart_alt" /> Atur ulang filter</button>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

              <div className="rp-pagination">
                <div>Menampilkan {datasetMeta?.from ?? (datasets.length ? 1 : 0)}–{datasetMeta?.to ?? datasets.length} dari {datasetMeta?.total ?? datasets.length} dataset</div>
                <div className="rp-page-controls" aria-label="Navigasi halaman dataset">
                  <button type="button" className="rp-page-btn" aria-label="Halaman sebelumnya" disabled={isLoading || (datasetMeta?.current_page ?? 1) <= 1} onClick={() => changeDatasetPage((datasetMeta?.current_page ?? 1) - 1)}><Icon name="chevron_left" /></button>
                  <span className="rp-page-btn active" aria-current="page" aria-label={`Halaman ${datasetMeta?.current_page ?? 1}`}>{datasetMeta?.current_page ?? 1}</span>
                  <button type="button" className="rp-page-btn" aria-label="Halaman berikutnya" disabled={isLoading || (datasetMeta?.current_page ?? 1) >= (datasetMeta?.last_page ?? 1)} onClick={() => changeDatasetPage((datasetMeta?.current_page ?? 1) + 1)}><Icon name="chevron_right" /></button>
                </div>
              </div>
              </section>
            </motion.div>
          )}

          {/* Tab 1: API Reference */}
          {isResearcher && activeTab === 1 && (
            <motion.div className="api-ref" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: "800px" }}>
              {/* Panduan cepat: orientasi "mulai dari mana" sebelum detail teknis. */}
              <section className="api-quickstart" aria-labelledby="api-quickstart-title">
                <h2 id="api-quickstart-title">Mulai menggunakan API</h2>
                <ol className="api-steps">
                  <li>
                    <strong>Siapkan kunci akses.</strong> Gunakan tombol “Buat Kunci” di bagian atas. Salin kunci saat ditampilkan; kunci penuh hanya bisa dilihat sekali.
                  </li>
                  <li>
                    <strong>Sertakan kunci pada permintaan.</strong> Gunakan salah satu header berikut:
                    <div className="api-step-codes">
                      <code>{apiReference?.authentication.header ?? "X-API-Key: spr_xxx"}</code>
                      {apiReference?.authentication.alternative && (
                        <><span>atau</span><code>{apiReference.authentication.alternative}</code></>
                      )}
                    </div>
                  </li>
                  <li>
                    <strong>Pilih endpoint.</strong> Gunakan alamat dasar <code>{apiReference?.base_path ?? "/api/v1"}</code>. Contoh permintaan tersedia di setiap endpoint dan di akhir halaman ini.
                  </li>
                </ol>
              </section>

              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "var(--ink)" }}>Base URL</div>
                <div style={{ background: "var(--footer-bg)", borderRadius: "8px", padding: "16px", color: "var(--footer-text)", fontFamily: "monospace", fontSize: "13px" }}>
                  {apiReference?.base_path ?? "/api/v1"}
                </div>
              </div>

              {/* Autentikasi eksplisit: sebelumnya hanya tersirat di contoh curl. */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px", color: "var(--ink)" }}>Autentikasi</div>
                <div className="api-reference-copy">
                  Setiap permintaan wajib menyertakan API Key kamu di header:
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div><span className="api-inline-code">{apiReference?.authentication.header ?? "X-API-Key: spr_xxx"}</span></div>
                    {apiReference?.authentication.alternative && (
                      <div>atau <span className="api-inline-code">{apiReference.authentication.alternative}</span></div>
                    )}
                  </div>
                  <p className="rp-key-hint">Buat kunci melalui bagian “Kunci akses API”. Regenerasi akan mencabut kunci sebelumnya.</p>
                </div>
              </div>

              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "16px", color: "var(--ink)" }}>Endpoint Tersedia</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "40px" }}>
                {(apiReference?.endpoints ?? []).map((ep, i) => (
                  <section key={i} className="api-endpoint">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: ep.example_request ? "14px" : 0 }}>
                      <div style={{ background: "var(--green-badge-bg)", color: "var(--green-text)", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{ep.method}</div>
                      <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                        <div style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--ocean-dark)", marginBottom: "6px", fontWeight: 600 }}>{ep.path}</div>
                        <div style={{ fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5 }}>{ep.description} Scope: <code>{ep.scope}</code></div>
                        {ep.query && Object.keys(ep.query).length > 0 && (
                          <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {Object.entries(ep.query).map(([key, val]) => (
                              <span key={key} style={{ fontSize: "11px", fontFamily: "monospace", background: "var(--surface-muted)", color: "var(--ink)", padding: "2px 8px", borderRadius: "4px" }}>{key}=<span style={{ color: "var(--ink-soft)" }}>{val}</span></span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {ep.example_request && (
                      <details style={{ marginTop: "12px" }}>
                        <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--ocean-dark)" }}>Lihat contoh request &amp; response</summary>
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", marginBottom: "6px" }}>Request</div>
                          <pre style={{ background: "var(--footer-bg)", borderRadius: 6, padding: "14px", color: "var(--footer-text)", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.5, overflowX: "auto", margin: 0 }}>{ep.example_request}</pre>
                          {ep.example_response != null && (
                            <>
                              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", margin: "12px 0 6px" }}>Response (200)</div>
                              <pre style={{ background: "var(--footer-bg)", borderRadius: 6, padding: "14px", color: "var(--footer-text)", fontFamily: "monospace", fontSize: "12px", lineHeight: 1.5, overflowX: "auto", margin: 0 }}>{JSON.stringify(ep.example_response, null, 2)}</pre>
                            </>
                          )}
                        </div>
                      </details>
                    )}
                  </section>
                ))}
              </div>

              {apiReference?.rate_limit && (
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "var(--ink)" }}>Batas Permintaan (Rate Limit)</div>
                  <div className="api-reference-copy">
                    <strong style={{ color: "var(--ink)" }}>{apiReference.rate_limit.per_minute} permintaan / menit</strong> ({apiReference.rate_limit.scope}). {apiReference.rate_limit.note}
                    <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {apiReference.rate_limit.headers.map((h) => <code key={h} style={{ fontSize: "11px", background: "var(--surface-muted)", padding: "2px 8px", borderRadius: "4px" }}>{h}</code>)}
                    </div>
                  </div>
                </div>
              )}

              {apiReference?.error_format && (
                <div style={{ marginBottom: "32px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "var(--ink)" }}>Format Error</div>
                  <div className="api-reference-copy">
                    <pre style={{ background: "var(--footer-bg)", borderRadius: 6, padding: "12px", color: "var(--footer-text)", fontFamily: "monospace", fontSize: "12px", margin: "0 0 12px", overflowX: "auto" }}>{JSON.stringify(apiReference.error_format.shape, null, 2)}</pre>
                    <div className="api-error-codes">
                      {Object.entries(apiReference.error_format.codes).map(([code, desc]) => (
                        <div key={code} className="api-error-row"><code>{code}</code><span>{desc}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px", color: "var(--ink)" }}>Contoh Request</div>
              <div style={{ background: "var(--footer-bg)", borderRadius: 8, padding: "20px", color: "var(--footer-text)", fontFamily: "monospace", fontSize: "13px", lineHeight: 1.6, overflowX: "auto" }}>
                <span style={{ color: "#93c5fd" }}>curl</span> -H <span style={{ color: "#86efac" }}>"{apiReference?.authentication.header ?? "X-API-Key: spr_xxx"}"</span> \<br />
                &nbsp;&nbsp;<span style={{ color: "#86efac" }}>"{apiReference?.base_path ?? "/api/v1"}/predictions/daily?from=2026-05-21&amp;to=2026-05-21"</span>
              </div>
              {apiReference?.license_note && <p style={{ marginTop: 16, color: "var(--ink-soft)", fontSize: 13 }}>{apiReference.license_note}</p>}
            </motion.div>
          )}

          {/* Tab 2: Penggunaan API (per endpoint, 30 hari terakhir) */}
          {isResearcher && activeTab === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: "900px" }}>
              {usageLoading && (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--ink-soft)", fontSize: "13px" }}>
                  <Icon name="hourglass_empty" style={{ fontSize: "20px" }} /> Memuat statistik penggunaan…
                </div>
              )}

              {!usageLoading && usage && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "20px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>
                      Total {usage.total_calls.toLocaleString("id-ID")} panggilan API dalam {usage.window_days} hari terakhir
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--ink-soft)" }}>Sejak {usage.since}</div>
                  </div>

                  {/* Tren harian */}
                  <div style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface)", marginBottom: "24px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "16px" }}>Tren Harian</div>
                    {(() => {
                      const maxTotal = Math.max(1, ...usage.per_day.map((d) => d.total));
                      return (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "120px" }}>
                          {usage.per_day.map((d) => {
                            const h = Math.round((d.total / maxTotal) * 100);
                            // Persentase relatif terhadap batang induk (yang sudah
                            // setinggi h%) — dikali h lagi membuat porsi "Gagal"
                            // terskala dua kali (100% gagal tampak cuma h%).
                            const failH = d.total > 0 ? Math.round((d.failed / d.total) * 100) : 0;
                            return (
                              <div key={d.day} title={`${d.day}: ${d.total} panggilan (${d.failed} gagal)`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative" }}>
                                <div style={{ height: `${h}%`, background: "var(--ocean-light)", borderRadius: "3px 3px 0 0", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: d.total > 0 ? "2px" : 0 }}>
                                  {failH > 0 && <div style={{ height: `${failH}%`, background: "var(--critical)", borderRadius: "3px 3px 0 0" }} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "11px", color: "var(--ink-soft)" }}>
                      <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--ocean-light)", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Berhasil</span>
                      <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--critical)", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />Gagal</span>
                    </div>
                  </div>

                  {/* Per endpoint */}
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)", marginBottom: "12px" }}>Penggunaan per Endpoint</div>
                  <div className="panel flush" style={{ overflow: "hidden", border: "1px solid var(--line)" }}>
                    <div className="table-responsive">
                      <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--surface-soft)" }}>
                            <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)" }}>Endpoint</th>
                            <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)", textAlign: "right" }}>Total</th>
                            <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)", textAlign: "right" }}>Berhasil</th>
                            <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "var(--ink-soft)", textAlign: "right" }}>Gagal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usage.per_endpoint.map((row, i) => (
                            <tr key={row.endpoint} style={{ borderBottom: i === usage.per_endpoint.length - 1 ? "none" : "1px solid var(--line)" }}>
                              <td style={{ padding: "14px 20px", fontSize: "13px", fontFamily: "monospace", color: "var(--ocean-dark)" }}>{row.endpoint}</td>
                              <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--ink)", textAlign: "right", fontWeight: 600 }}>{row.total.toLocaleString("id-ID")}</td>
                              <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--ink)", textAlign: "right" }}>{row.success.toLocaleString("id-ID")}</td>
                              <td style={{ padding: "14px 20px", fontSize: "13px", textAlign: "right", color: row.failed > 0 ? "var(--critical)" : "var(--ink-soft)", fontWeight: row.failed > 0 ? 600 : 400 }}>{row.failed.toLocaleString("id-ID")}</td>
                            </tr>
                          ))}
                          {usage.per_endpoint.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "var(--ink-soft)" }}>Belum ada panggilan API tercatat dalam 30 hari terakhir.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {!usageLoading && !usage && (
                <InlineNotice>Statistik penggunaan belum tersedia.</InlineNotice>
              )}
            </motion.div>
          )}

          {/* Tab Lisensi Data — tab terpisah (peneliti: idx 3, non-peneliti: idx 1) */}
          {((isResearcher && activeTab === 3) || (!isResearcher && activeTab === 1)) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: "900px" }}>
              <div style={{ marginBottom: "20px", fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.6 }}>
                Ketentuan lisensi dan perizinan untuk setiap dataset yang tersedia di portal. Pastikan mencantumkan atribusi sesuai lisensi ketika menggunakan atau menerbitkan ulang data.
              </div>

              {(() => {
                const groups = datasets.reduce<Record<string, DatasetData[]>>((acc, ds) => {
                  const key = (ds.license && ds.license.trim()) || "Lisensi tidak dicantumkan";
                  (acc[key] ||= []).push(ds);
                  return acc;
                }, {});
                const entries = Object.entries(groups);

                if (entries.length === 0) {
                  return <InlineNotice>Belum ada dataset untuk ditampilkan lisensinya.</InlineNotice>;
                }

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {entries.map(([license, items]) => (
                      <div key={license} style={{ padding: "20px", border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                          <Icon name="gavel" style={{ fontSize: "18px", color: "var(--ocean-dark)" }} />
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--ink)" }}>{license}</div>
                          <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>({items.length} dataset)</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {items.map((ds) => (
                            <div key={ds.id} className="rp-license-item">
                              <div style={{ color: "var(--ink)", fontWeight: 500 }}>{ds.name}</div>
                              <div className="rp-license-coverage">
                                {(ds.coverage_regencies && ds.coverage_regencies.length > 0) ? ds.coverage_regencies.join(", ") : "Cakupan provinsi"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <p style={{ marginTop: "20px", fontSize: "12px", color: "var(--ink-soft)", lineHeight: 1.6 }}>
                Data mentah (pasang surut, batas wilayah) mengikuti ketentuan sumber resmi seperti BIG/BMKG. Dataset turunan yang dihasilkan sistem mengikuti lisensi yang tercantum di atas.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
