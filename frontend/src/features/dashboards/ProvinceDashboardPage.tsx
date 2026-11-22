import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../../shared/components/AppShell";
import { riskColors } from "../../shared/constants/risk";
import "./dashboardKit.css";
import { api, apiUrl, downloadFile, errorMessage } from "../../shared/api/client";
import { fetchProvinceSummary, invalidateProvinceSummaryCache } from "../../shared/api/provinceSummaryCache";
import { ProvinceTrendChart } from "../../shared/components/ProvinceTrendChart";
import { useToast } from "../../shared/components/Toast";
import { Icon } from "../../shared/components/Icon";
import { riskLabels } from "../../shared/constants/risk";
import { motion, type Variants } from "framer-motion";

interface SummaryData {
  monitored_regencies: number;
  high_risk_villages: number;
  risk_population: number;
  validated_reports_this_month: number;
  latest_prediction_date?: string | null;
  regencies?: RegencySummary[];
  trend_30_days?: {
    prediction_date: string;
    avg_probability: number | string;
    max_probability: number | string;
    critical_count?: number | string;
    high_count?: number | string;
    high_risk_count?: number | string;
  }[];
  filters?: { month?: string | null; regency?: string | null };
  available_regencies?: string[];
  top_impacted?: TopImpactedPrediction[];
  population_audit?: {
    total_regions: number;
    with_population: number;
    official_bps_population: number;
    missing_population: number;
    status: "bps_verified" | "region_population_available" | "incomplete";
  };
}

interface RegencySummary {
  regency: string;
  low_count: number;
  medium_count: number;
  high_count: number;
  critical_count: number;
  risk_population: number;
  max_probability: number;
  trend: string;
  previous_high_risk_count?: number;
  high_risk_delta?: number;
}

interface TopImpactedPrediction {
  id: string;
  prediction_date: string;
  risk_probability: number;
  risk_class: "rendah" | "sedang" | "tinggi" | "sangat_tinggi";
  confidence_score: number | null;
  max_tidal_height: number | null;
  village: string | null;
  district: string | null;
  regency: string | null;
  population: number | null;
  population_source?: string | null;
  population_provenance_status?: string | null;
}

interface PredictionData {
  id: string;
  prediction_date: string;
  risk_probability: number;
  risk_class: "rendah" | "sedang" | "tinggi" | "sangat_tinggi";
  confidence_score: number | null;
  max_tidal_height: number | null;
  peak_time: string | null;
  region: { village: string | null; district: string | null; regency: string | null } | null;
}

interface SummaryResponse {
  data: SummaryData;
}

interface PredictionListResponse {
  data: PredictionData[];
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } }
};

function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Pilihan filter bulan: bulan depan s.d. 12 bulan lalu, format "YYYY-MM". */
function monthOptions(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + 1 - i, 1);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
    };
  });
}

const TREND_STYLE: Record<string, { cls: string; icon: string; label: string }> = {
  naik: { cls: "up", icon: "trending_up", label: "Naik" },
  turun: { cls: "down", icon: "trending_down", label: "Turun" },
  stabil: { cls: "flat", icon: "trending_flat", label: "Stabil" },
};

export function ProvinceDashboardPage() {
  const toast = useToast();
  const [summary, setSummary] = useState<SummaryData>({
    monitored_regencies: 0,
    high_risk_villages: 0,
    risk_population: 0,
    validated_reports_this_month: 0,
    regencies: [],
    trend_30_days: [],
  });
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedRegency, setSelectedRegency] = useState("all");
  const [sortKey, setSortKey] = useState<"risk" | "probability" | "population" | "name" | "trend">("risk");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [trendHoverIdx, setTrendHoverIdx] = useState<number | null>(null);
  const trendSvgRef = useRef<SVGSVGElement>(null);

  // Penanda urutan request: ganti bulan/kabupaten cepat menembakkan beberapa
  // fetch sekaligus, dan yang lebih lambat bisa mendarat BELAKANGAN sehingga
  // menimpa hasil filter yang sedang aktif. Hanya respons dari request terakhir
  // yang boleh menulis state. Pola yang sama dipakai AdminUsersPage.
  const fetchSeqRef = useRef(0);

  const fetchDashboardData = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.set("month", selectedMonth);
      if (selectedRegency !== "all") params.set("regency", selectedRegency);
      const query = params.toString();

      // Jika ada filter aktif, invalidate cache agar data segar ditarik.
      // Tanpa filter, cache dari landing page bisa langsung dipakai.
      if (query) invalidateProvinceSummaryCache();
      const summaryData = await fetchProvinceSummary(query);
      if (seq !== fetchSeqRef.current) return;
      setSummary(summaryData);

      // Prediksi terbaru untuk fallback tabel "10 kelurahan terdampak" bila
      // top_impacted kosong. Grafik tren TIDAK lagi pakai ini (lihat trendData).
      const predRes = await api<PredictionListResponse>(`/public/predictions?per_page=1000`);
      if (seq !== fetchSeqRef.current) return;
      setPredictions(predRes.data);

    } catch (err: unknown) {
      if (seq !== fetchSeqRef.current) return;
      toast.error(err instanceof Error ? err.message : "Gagal memuat data ringkasan provinsi.");
    } finally {
      // Spinner hanya dimatikan oleh request terakhir; kalau tidak, request lama
      // yang selesai duluan membuat UI tampak siap padahal data baru masih jalan.
      if (seq === fetchSeqRef.current) setIsLoading(false);
    }
  }, [selectedMonth, selectedRegency]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleProvinceExport = async () => {
    try {
      await downloadFile("/dashboard/province/export", "dashboard-provinsi-risiko.csv", {
        month: selectedMonth,
        regency: selectedRegency === "all" ? "" : selectedRegency,
      });
      toast.success("Export CSV provinsi mulai diunduh.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal mengekspor CSV provinsi."));
    }
  };

  const getRegencySummary = () => {
    if (summary.regencies?.length) {
      return summary.regencies.map((item) => {
        const riskClass = item.critical_count > 0 ? "sangat_tinggi" : item.high_count > 0 ? "tinggi" : item.medium_count > 0 ? "sedang" : "rendah";
        return {
          name: item.regency,
          riskClass,
          probability: `${Number(item.max_probability ?? 0).toFixed(0)}%`,
          villagesCount: `${Number(item.low_count) + Number(item.medium_count) + Number(item.high_count) + Number(item.critical_count)} Kelurahan`,
          riskPopulation: toNumber(item.risk_population),
          maxProbability: toNumber(item.max_probability),
          highRiskCount: toNumber(item.high_count) + toNumber(item.critical_count),
          delta: toNumber(item.high_risk_delta),
          priority: item.trend === "naik" ? "Prioritas koordinasi" : item.trend === "turun" ? "Risiko menurun" : "Monitoring Harian",
          trend: item.trend,
        };
      });
    }

    const map: Record<string, { count: number; maxProb: number; class: string }> = {};
    predictions.forEach((p) => {
      const regency = p.region?.regency ?? "Wilayah tidak diketahui";
      if (!map[regency]) {
        map[regency] = { count: 0, maxProb: 0, class: "rendah" };
      }
      map[regency].count += 1;
      if (p.risk_probability > map[regency].maxProb) {
        map[regency].maxProb = p.risk_probability;
        map[regency].class = p.risk_class;
      }
    });

    return Object.entries(map).map(([name, val]) => ({
      name,
      riskClass: val.class,
      probability: `${val.maxProb}%`,
      villagesCount: `${val.count} Kelurahan`,
      riskPopulation: 0,
      maxProbability: val.maxProb,
      highRiskCount: val.class === "sangat_tinggi" || val.class === "tinggi" ? val.count : 0,
      delta: 0,
      trend: val.class === "sangat_tinggi" || val.class === "tinggi" ? "naik" : "stabil",
      priority: val.class === "sangat_tinggi" || val.class === "tinggi" ? "Prioritas Evakuasi / Pantau Pasang" : "Monitoring Harian",
    }));
  };

  const regenciesData = useMemo(() => {
    const riskRank: Record<string, number> = { rendah: 1, sedang: 2, tinggi: 3, sangat_tinggi: 4 };
    const trendRank: Record<string, number> = { turun: 1, stabil: 2, naik: 3 };
    const rows = getRegencySummary();
    return rows.sort((a, b) => {
      const direction = sortDirection === "desc" ? -1 : 1;
      if (sortKey === "name") return a.name.localeCompare(b.name) * direction;
      if (sortKey === "probability") return (a.maxProbability - b.maxProbability) * direction;
      if (sortKey === "population") return (a.riskPopulation - b.riskPopulation) * direction;
      if (sortKey === "trend") return ((trendRank[a.trend] ?? 0) - (trendRank[b.trend] ?? 0)) * direction;
      return ((riskRank[a.riskClass] ?? 0) - (riskRank[b.riskClass] ?? 0) || a.maxProbability - b.maxProbability) * direction;
    });
  }, [summary.regencies, predictions, sortKey, sortDirection]);

  // FR-PROV-3: grafik prediksi 30 hari KE DEPAN — rata-rata (garis utama) &
  // maksimum (garis putus-putus) peluang rob harian. Sumbernya
  // summary.trend_30_days yang diagregasi server (mengikuti filter kabupaten
  // halaman), BUKAN rata-rata dari /public/predictions — endpoint itu terurut
  // DESC & terbatas 1000 baris sehingga hanya memuat ~3 hari terjauh, bukan
  // 30 hari penuh.
  const trendData = useMemo(() => {
    const byDate = new Map<string, { avgProb: number; maxProb: number; criticalCount: number; highCount: number; highRiskCount: number }>();
    for (const row of summary.trend_30_days ?? []) {
      const key = row.prediction_date.substring(0, 10);
      byDate.set(key, {
        avgProb: toNumber(row.avg_probability),
        maxProb: toNumber(row.max_probability),
        criticalCount: toNumber(row.critical_count),
        highCount: toNumber(row.high_count),
        highRiskCount: toNumber(row.high_risk_count),
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actualToday = toDateKey(today);

    return Array.from({ length: 30 }, (_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() + index);
      const key = toDateKey(d);
      const stat = byDate.get(key);
      return {
        date: d,
        avgProb: stat?.avgProb ?? 0,
        maxProb: stat?.maxProb ?? 0,
        criticalCount: stat?.criticalCount ?? 0,
        highCount: stat?.highCount ?? 0,
        highRiskCount: stat?.highRiskCount ?? 0,
        isToday: key === actualToday,
        hasData: !!stat,
      };
    });
  }, [summary.trend_30_days]);

  return (
    // Judul tak lagi menyebut "BPBD Provinsi": perannya sudah dihapus saat
    // penyederhanaan peran, dan halaman ini kini menu pantauan milik admin.
    <AppShell active="province" title="Pantauan Provinsi">
      <style>{`
        /* Toolbar filter */
        .prov-toolbar { align-items: flex-end; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; padding: 14px 16px; }
        .prov-field { display: flex; flex-direction: column; gap: 5px; }
        .prov-field label { color: var(--ink-soft); font-size: 12px; font-weight: 600; }
        .prov-control { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; box-sizing: border-box; color: var(--ink); cursor: pointer; font: inherit; font-size: 13.5px; font-weight: 600; height: 40px; min-width: 200px; padding: 0 12px; }
        .prov-control:focus { border-color: var(--ocean-dark); box-shadow: 0 0 0 3px var(--ocean-light); outline: none; }
        .prov-reset { align-items: center; background: transparent; border: 0; color: var(--ocean-dark); cursor: pointer; display: inline-flex; font: inherit; font-size: 13px; font-weight: 700; gap: 5px; height: 40px; padding: 0 6px; }
        .prov-reset:hover { text-decoration: underline; }
        .prov-reset .material-symbols-outlined { font-size: 17px; }
        .prov-toolbar-note { color: var(--ink-soft); font-size: 12.5px; margin-left: auto; align-self: center; }
        .prov-sort select, .prov-sort button { height: 38px; }

        @media (max-width: 768px) {
          .prov-toolbar { padding: 12px; }
          .prov-field { flex: 1 1 100%; }
          .prov-control { min-width: 0; width: 100%; }
          .prov-toolbar-note { margin-left: 0; }
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
            <h1>Pantauan Provinsi Lampung</h1>
            <p>Ringkasan prediksi rob per kabupaten/kota dan kelurahan yang paling terdampak.</p>
          </div>
          {summary.latest_prediction_date && (
            <span className="dash-refresh">
              <span className="dash-live-dot" aria-hidden="true" />
              Prediksi per {new Date(summary.latest_prediction_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </motion.div>

        {/* Toolbar filter */}
        <motion.div variants={itemVariants} className="prov-toolbar">
          <div className="prov-field">
            <label htmlFor="prov-month">Bulan prediksi</label>
            <select id="prov-month" className="prov-control" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>
              <option value="">Terbaru</option>
              {monthOptions().map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="prov-field">
            <label htmlFor="prov-regency">Kabupaten/kota</label>
            <select id="prov-regency" className="prov-control" value={selectedRegency} onChange={(event) => setSelectedRegency(event.target.value)}>
              <option value="all">Semua kabupaten/kota</option>
              {(summary.available_regencies ?? []).map((regency) => <option key={regency} value={regency}>{regency}</option>)}
            </select>
          </div>
          {(selectedMonth || selectedRegency !== "all") && (
            <button type="button" className="prov-reset" onClick={() => { setSelectedMonth(""); setSelectedRegency("all"); }}>
              <Icon name="restart_alt" /> Atur ulang
            </button>
          )}
          <span className="prov-toolbar-note">Semua angka di bawah mengikuti filter ini.</span>
        </motion.div>

        {/* Strip status */}
        <motion.div variants={itemVariants} className={`dash-status ${summary.high_risk_villages > 0 ? "busy" : "calm"}`} role="status">
          <span className="dash-status-icon"><Icon name={summary.high_risk_villages > 0 ? "warning" : "task_alt"} /></span>
          <div className="dash-status-text">
            <strong>
              {isLoading
                ? "Memuat ringkasan risiko…"
                : summary.high_risk_villages > 0
                  ? `${summary.high_risk_villages.toLocaleString("id-ID")} kelurahan berisiko tinggi sedang dipantau`
                  : "Tidak ada kelurahan berisiko tinggi pada prediksi ini"}
            </strong>
            <span>
              {summary.high_risk_villages > 0
                ? "Periksa tabel kabupaten/kota di bawah untuk wilayah yang perlu diprioritaskan."
                : "Dihitung dari prediksi risiko terbaru dan laporan warga yang telah divalidasi."}
            </span>
          </div>
        </motion.div>

        {/* KPI Grid */}
        <motion.div variants={containerVariants} className="dash-kpis">
          {[
            { title: "Kabupaten/kota dipantau", val: toNumber(summary.monitored_regencies).toLocaleString("id-ID"), sub: "wilayah pesisir Lampung", icon: "map", color: "var(--ocean-dark)", alert: false },
            { title: "Kelurahan risiko tinggi", val: toNumber(summary.high_risk_villages).toLocaleString("id-ID"), sub: "kelas Tinggi & Sangat Tinggi", icon: "warning", color: riskColors.tinggi, alert: toNumber(summary.high_risk_villages) > 0 },
            { title: "Warga terdampak potensial", val: toNumber(summary.risk_population).toLocaleString("id-ID"), sub: summary.population_audit?.status === "bps_verified" ? "data BPS terverifikasi" : summary.population_audit?.status === "region_population_available" ? "berdasarkan data wilayah" : "data populasi belum lengkap", icon: "groups", color: "#d97706", alert: toNumber(summary.risk_population) > 0 },
            { title: "Laporan tervalidasi", val: toNumber(summary.validated_reports_this_month).toLocaleString("id-ID"), sub: "bulan ini", icon: "verified", color: riskColors.rendah, alert: false },
          ].map((kpi, idx) => (
            <motion.div key={kpi.title} variants={itemVariants} className="dash-kpi" style={{ ["--kpi-color" as string]: kpi.color }}>
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
                {kpi.val}
              </motion.strong>
              <span className="dash-kpi-sub">{kpi.sub}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Full Width Layout */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "32px" }}>
          {/* Table per Kabupaten */}
          <motion.div variants={itemVariants} className="panel flush">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Tingkat Risiko per Kabupaten/Kota</h2>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--ink-soft)" }}>
                  Tren = perubahan jumlah kelurahan berisiko tinggi dibanding tanggal prediksi sebelumnya.
                </p>
              </div>
              <div className="prov-sort" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select value={sortKey} onChange={(event) => setSortKey(event.target.value as typeof sortKey)} style={{ minWidth: 170 }}>
                  <option value="risk">Bahaya tertinggi</option>
                  <option value="probability">Peluang rob</option>
                  <option value="population">Populasi risiko</option>
                  <option value="trend">Tren</option>
                  <option value="name">Nama wilayah</option>
                </select>
                <button className="btn secondary" style={{ fontSize: "12px" }} onClick={() => setSortDirection((value) => value === "desc" ? "asc" : "desc")}>
                  <Icon name="sort" style={{ fontSize: "14px" }} /> {sortDirection === "desc" ? "Turun" : "Naik"}
                </button>
              </div>
            </div>
            <div className="table-responsive">
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)" }}>Kabupaten/Kota</th>
                  <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)" }}>Kelas risiko</th>
                  <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)", textAlign: "right" }}>Peluang rob tertinggi</th>
                  <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)", textAlign: "right" }}>Populasi berisiko</th>
                  <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)", textAlign: "right" }}>Tren</th>
                </tr>
              </thead>
              <tbody>
                {regenciesData.map((item, idx) => {
                  const color = riskColors[item.riskClass] ?? riskColors.rendah;
                  const probability = Math.max(0, Math.min(100, Math.round(item.maxProbability)));
                  const trend = TREND_STYLE[item.trend] ?? TREND_STYLE.stabil;
                  return (
                  <motion.tr
                    key={item.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 + (idx * 0.04) }}
                    style={{ borderBottom: "1px solid var(--line)", ["--pill" as string]: color }}
                  >
                    <td style={{ padding: "14px 24px", fontWeight: 600 }}>
                      {item.name}
                      <div style={{ fontSize: "12px", color: "var(--ink-soft)", fontWeight: 400, marginTop: "3px" }}>{item.villagesCount.replace("Kelurahan", "kelurahan")} dipantau</div>
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span className="dash-pill"><i />{riskLabels[item.riskClass] ?? item.riskClass}</span>
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <span className="dash-prob">
                        <span className="dash-prob-bar" aria-hidden="true"><span style={{ width: `${probability}%` }} /></span>
                        <b>{probability}%</b>
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <span className={item.riskPopulation > 0 ? "dash-num" : "dash-num dash-muted"}>{item.riskPopulation.toLocaleString("id-ID")}</span>
                    </td>
                    <td style={{ padding: "14px 24px", textAlign: "right" }}>
                      <span className={`dash-trend ${trend.cls}`} title={item.delta !== 0 ? `${item.delta > 0 ? "+" : ""}${item.delta} kelurahan berisiko tinggi dibanding prediksi sebelumnya` : "Tidak ada perubahan"}>
                        <Icon name={trend.icon} /> {trend.label}{item.delta !== 0 ? ` ${item.delta > 0 ? "+" : "−"}${Math.abs(item.delta)}` : ""}
                      </span>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </motion.div>

          {/* ML Prediction Timeline — Line & Area Chart */}
          <motion.div variants={itemVariants} className="panel" style={{ display: "flex", flexDirection: "column" }}>
            <ProvinceTrendChart 
              summary={summary} 
              hideLink 
              headerRight={
                <select
                  value={selectedRegency}
                  onChange={(e) => setSelectedRegency(e.target.value)}
                  style={{
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    color: "var(--ink)",
                    fontSize: "12.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="all">Semua Kabupaten/Kota</option>
                  {summary.available_regencies?.map((reg) => (
                    <option key={reg} value={reg}>{reg}</option>
                  ))}
                </select>
              }
            />
          </motion.div>
        </div>

        {/* Kelurahan Paling Terdampak */}
        <motion.div variants={itemVariants} className="panel flush">
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.15rem" }}>10 Kelurahan Paling Terdampak & Kritis</h2>
              <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--ink-soft)" }}>
                Berdasarkan prediksi terbaru, kelas risiko, peluang rob, dan populasi region. Filter mengikuti pilihan bulan/kabupaten di atas.
              </p>
            </div>
            <button className="btn secondary" style={{ fontSize: "12px" }} onClick={handleProvinceExport}><Icon name="download" style={{ fontSize: "14px" }} /> Ekspor CSV Data Utama</button>
          </div>
          <div className="table-responsive">
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--line)" }}>
                <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)", width: "40px" }}>#</th>
                <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)" }}>Kelurahan</th>
                <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)" }}>Kecamatan, kabupaten/kota</th>
                <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)" }}>Kelas risiko</th>
                <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)", textAlign: "right" }}>Peluang rob</th>
                <th style={{ padding: "14px 24px", fontSize: "12px", color: "var(--ink-soft)", textAlign: "right" }}>Puncak pasang</th>
              </tr>
            </thead>
            <tbody>
              {(summary.top_impacted?.length ? summary.top_impacted : predictions
                .slice()
                .sort((a, b) => b.risk_probability - a.risk_probability)
                .slice(0, 10)
                .map((p) => ({
                  id: p.id,
                  prediction_date: p.prediction_date,
                  risk_probability: p.risk_probability,
                  risk_class: p.risk_class,
                  confidence_score: p.confidence_score,
                  max_tidal_height: p.max_tidal_height,
                  village: p.region?.village ?? null,
                  district: p.region?.district ?? null,
                  regency: p.region?.regency ?? null,
                  population: null,
                })))
                .map((p, index) => {
                const color = riskColors[p.risk_class] ?? riskColors.rendah;
                const probability = Math.max(0, Math.min(100, Math.round(toNumber(p.risk_probability))));
                return (
                <motion.tr
                  key={p.id}
                  style={{ borderBottom: "1px solid var(--line)", ["--pill" as string]: color }}
                >
                  <td style={{ padding: "14px 24px", color: "var(--ink-soft)", fontWeight: 700 }}>{index + 1}</td>
                  <td style={{ padding: "14px 24px", fontWeight: 600 }}>
                    {p.village ?? "-"}
                    <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 400, marginTop: 3 }}>
                      {toNumber(p.population) > 0 ? `${toNumber(p.population).toLocaleString("id-ID")} jiwa` : "Populasi belum tersedia"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 24px", color: "var(--ink-soft)" }}>{p.district ?? "-"}, {p.regency ?? "-"}</td>
                  <td style={{ padding: "14px 24px" }}>
                    <span className="dash-pill"><i />{riskLabels[p.risk_class] ?? p.risk_class}</span>
                  </td>
                  <td style={{ padding: "14px 24px", textAlign: "right" }}>
                    <span className="dash-prob">
                      <span className="dash-prob-bar" aria-hidden="true"><span style={{ width: `${probability}%` }} /></span>
                      <b>{probability}%</b>
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px", textAlign: "right" }}>
                    {p.max_tidal_height
                      ? <span className="dash-num">{toNumber(p.max_tidal_height).toLocaleString("id-ID", { maximumFractionDigits: 2 })} m</span>
                      : <span className="dash-muted">—</span>}
                  </td>
                </motion.tr>
                );
              })}
              </tbody>
            </table>
            </div>
          </motion.div>
        </motion.div>
    </AppShell>
  );
}

