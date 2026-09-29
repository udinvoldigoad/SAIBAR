/**
 * ProvinceTrendChart — grafik SVG "Prediksi Peluang Rob 30 Hari ke Depan".
 *
 * Komponen ini diekstrak dari ProvinceDashboardPage agar bisa dipakai
 * ulang di landing page tanpa duplikasi kode. Datanya ditarik melalui
 * shared cache (provinceSummaryCache) sehingga jika pengguna berpindah
 * dari landing ke halaman Pantauan Provinsi, data yang sudah di-cache
 * langsung dipakai — tidak ada request ganda.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../components/Icon";
import {
  fetchProvinceSummary,
  getProvinceSummaryCached,
  type ProvinceSummaryData,
} from "../api/provinceSummaryCache";

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ProvinceTrendChartProps {
  summary?: ProvinceSummaryData | null;
  hideLink?: boolean;
  headerRight?: React.ReactNode;
}

export function ProvinceTrendChart({ summary: propSummary, hideLink, headerRight }: ProvinceTrendChartProps) {
  const [internalSummary, setInternalSummary] = useState<ProvinceSummaryData | null>(propSummary || getProvinceSummaryCached());
  const [loading, setLoading] = useState(!propSummary && !internalSummary);
  const [error, setError] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const summary = propSummary || internalSummary;

  useEffect(() => {
    if (propSummary) return; // Ignore fetch if controlled via props
    let alive = true;
    fetchProvinceSummary()
      .then((data) => { if (alive) { setInternalSummary(data); setLoading(false); } })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, [propSummary]);

  const trendData = useMemo(() => {
    const byDate = new Map<string, { avgProb: number; maxProb: number }>();
    for (const row of summary?.trend_30_days ?? []) {
      const key = row.prediction_date.substring(0, 10);
      byDate.set(key, {
        avgProb: toNumber(row.avg_probability),
        maxProb: toNumber(row.max_probability),
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const actualToday = toDateKey(today);

    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = toDateKey(d);
      const stat = byDate.get(key);
      return {
        date: d,
        avgProb: stat?.avgProb ?? 0,
        maxProb: stat?.maxProb ?? 0,
        isToday: key === actualToday,
        hasData: !!stat,
      };
    });
  }, [summary?.trend_30_days]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-soft)" }}>
        Memuat grafik prediksi…
      </div>
    );
  }
  if (error || !summary) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-soft)" }}>
        Gagal memuat data prediksi.
      </div>
    );
  }

  const svgW = 800, svgH = 265;
  const pad = { top: 30, right: 24, bottom: 30, left: 48 };
  const chartW = svgW - pad.left - pad.right;
  const chartH = svgH - pad.top - pad.bottom;
  const data = trendData;

  const validIndices = data.map((d, i) => (d.hasData ? i : -1)).filter((i) => i !== -1);
  const firstValidIdx = validIndices.length > 0 ? validIndices[0] : 0;
  const lastValidIdx = validIndices.length > 0 ? validIndices[validIndices.length - 1] : 0;

  const maxDataVal = Math.max(...data.map((d) => (d.hasData ? Math.max(d.avgProb, d.maxProb) : 0)), 10);
  const max = Math.max(20, Math.ceil(maxDataVal / 10) * 10);
  const uniqueYTicks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  const xOf = (i: number) => pad.left + (i / Math.max(1, data.length - 1)) * chartW;
  const yOf = (v: number) => pad.top + chartH - (v / max) * chartH;

  const buildLine = (get: (d: typeof data[number]) => number) => {
    let path = "";
    let isFirst = true;
    data.forEach((d, i) => {
      if (!d.hasData) return;
      path += `${isFirst ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(get(d)).toFixed(1)} `;
      isFirst = false;
    });
    return path.trim();
  };

  const primaryLine = buildLine((d) => d.avgProb);
  const primaryArea = validIndices.length > 0
    ? `${primaryLine} L${xOf(lastValidIdx).toFixed(1)},${yOf(0).toFixed(1)} L${xOf(firstValidIdx).toFixed(1)},${yOf(0).toFixed(1)} Z`
    : "";
  const secondaryLine = buildLine((d) => d.maxProb);

  const primaryColor = "#2563eb";
  const secondaryColor = "var(--high, #f97316)";

  const xTickStep = Math.max(1, Math.floor(data.length / 5));
  const xTicks = data.map((_, i) => i).filter((i) => i % xTickStep === 0 || i === data.length - 1);
  const todayIdx = data.findIndex((d) => d.isToday);

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverX = hoverIdx !== null ? xOf(hoverIdx) : 0;
  const hoverY = hovered ? yOf(hovered.avgProb) : 0;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    let closestI = 0;
    let minD = Infinity;
    data.forEach((_, i) => {
      const d = Math.abs(xOf(i) - svgP.x);
      if (d < minD) { minD = d; closestI = i; }
    });
    if (minD < 30) setHoverIdx(closestI);
    else setHoverIdx(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: "1.25rem", color: "var(--ink)" }}>Prediksi Peluang Rob 30 Hari ke Depan</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--ink-soft)", lineHeight: 1.5, maxWidth: "520px" }}>
            Rata-rata persentase peluang terjadinya banjir rob harian dibandingkan titik maksimum tertinggi.
          </p>
        </div>
        {headerRight && <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>{headerRight}</div>}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", fontSize: "12px", fontWeight: 600, marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "#2563eb", borderRadius: "3px" }}></div>
          <span style={{ color: "var(--ink)" }}>Rata-rata Peluang Wilayah</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "12px", background: "var(--high, #f97316)", borderRadius: "3px" }}></div>
          <span style={{ color: "var(--ink-soft)" }}>Peluang Maksimum (Titik Ekstrem)</span>
        </div>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${svgW} ${svgH}`}
        style={{ width: "100%", height: "auto", maxHeight: 330, cursor: "crosshair", overflow: "visible" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id="landingTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y Grid lines */}
        {uniqueYTicks.map((t) => (
          <g key={`y-${t}`}>
            <line x1={pad.left} y1={yOf(t)} x2={pad.left + chartW} y2={yOf(t)} stroke="var(--line, #e5e7eb)" strokeWidth="0.8" opacity="0.6" />
            <text x={pad.left - 10} y={yOf(t) + 4} textAnchor="end" fontSize="11" fill="var(--ink-soft, #94a3b8)" fontWeight="600">
              {t}%
            </text>
          </g>
        ))}

        {/* Area under primary line */}
        {primaryArea && <path d={primaryArea} fill="url(#landingTrendAreaGrad)" />}

        {/* Secondary line (Maksimum) */}
        {secondaryLine && <path d={secondaryLine} fill="none" stroke={secondaryColor} strokeWidth="2.2" strokeDasharray="5 5" opacity="0.85" />}

        {/* Primary line (Rata-rata) */}
        {primaryLine && <path d={primaryLine} fill="none" stroke={primaryColor} strokeWidth="3" />}

        {/* Dots for primary line */}
        {data.map((d, i) => d.hasData ? (
          <circle
            key={`dot-${i}`}
            cx={xOf(i)} cy={yOf(d.avgProb)} r="4"
            fill={primaryColor}
            strokeWidth={d.isToday ? 2 : 0}
            stroke="var(--surface, #fff)"
            opacity={hoverIdx === i ? 0 : 1}
          />
        ) : null)}

        {/* Today vertical marker */}
        {todayIdx >= 0 && (
          <g>
            <line x1={xOf(todayIdx)} y1={pad.top - 14} x2={xOf(todayIdx)} y2={yOf(0)} stroke="var(--critical, #dc2626)" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.6" />
            <rect x={xOf(todayIdx) - 24} y={pad.top - 26} width="48" height="18" rx="4" fill="var(--critical, #dc2626)" />
            <text x={xOf(todayIdx)} y={pad.top - 13.5} textAnchor="middle" fontSize="10" fill="var(--surface, #fff)" fontWeight="700">Hari ini</text>
          </g>
        )}

        {/* X-Axis labels */}
        {xTicks.map((i) => (
          <text key={`x-${i}`} x={xOf(i)} y={svgH - 6} textAnchor="middle" fontSize="10.5" fill={data[i]?.isToday ? primaryColor : "var(--ink-soft)"} fontWeight={data[i]?.isToday ? 700 : 500}>
            {data[i]?.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </text>
        ))}

        {/* Hover crosshair & tooltip */}
        {hoverIdx !== null && hovered && (
          <g style={{ pointerEvents: "none" }}>
            <line x1={hoverX} y1={pad.top} x2={hoverX} y2={yOf(0)} stroke={primaryColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            <circle cx={hoverX} cy={hoverY} r="6" fill={primaryColor} stroke="var(--surface)" strokeWidth="2.5" />
            <circle cx={hoverX} cy={hoverY} r="10" fill={primaryColor} opacity="0.15" />

            {hovered.hasData && (
              <circle cx={hoverX} cy={yOf(hovered.maxProb)} r="4" fill={secondaryColor} stroke="var(--surface)" strokeWidth="1.5" />
            )}

            {(() => {
              const tooltipW = 200, tooltipH = 58;
              let tx = hoverX - tooltipW / 2;
              if (tx < pad.left) tx = pad.left;
              if (tx + tooltipW > pad.left + chartW) tx = pad.left + chartW - tooltipW;
              const ty = Math.max(pad.top - 6, hoverY - tooltipH - 20);
              return (
                <g>
                  <rect x={tx} y={ty} width={tooltipW} height={tooltipH} rx="8" fill="var(--surface, #fff)" stroke="var(--line, #e2e8f0)" strokeWidth="1" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.12))" />
                  <text x={tx + tooltipW / 2} y={ty + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink, #1e293b)">
                    {hovered.date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "long" })}
                  </text>
                  <text x={tx + tooltipW / 2} y={ty + 40} textAnchor="middle" fontSize="11.5" fontWeight="600">
                    <tspan fill={primaryColor}>{hovered.avgProb.toFixed(1)}% Rata-rata</tspan>
                    <tspan fill="var(--ink-soft)"> | </tspan>
                    <tspan fill={secondaryColor}>{hovered.maxProb.toFixed(1)}% Max</tspan>
                  </text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Link ke halaman lengkap */}
      {!hideLink && (
        <div style={{ marginTop: "16px", textAlign: "right" }}>
          <a
            href="#/province"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              fontSize: "0.92rem", fontWeight: 600, color: "var(--accent-blue, #2563eb)",
              textDecoration: "none", transition: "transform 0.2s",
            }}
          >
            Lihat Pantauan Lengkap <Icon name="arrow_forward" style={{ fontSize: "18px" }} />
          </a>
        </div>
      )}
    </div>
  );
}
