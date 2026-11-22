/**
 * Prakiraan rob 7 hari di hero landing.
 *
 * Tiap hari satu ubin: angka = peluang rob tertinggi di antara kelurahan
 * terpantau, warna & label = kelas risiko terburuk hari itu (palet yang sama
 * dengan peta). Ubin (bukan batang 0–100%) tetap terbaca saat peluangnya
 * kecil, tanpa membesar-besarkan angka. Datanya dari
 * /public/province/forecast (anonim). Bila gagal dimuat atau kosong,
 * komponen tidak merender apa pun — tidak ada angka karangan.
 */
import { useEffect, useState } from "react";
import { Icon } from "../shared/components/Icon";
import { riskColors, riskLabels } from "../shared/constants/risk";
import {
  fetchPublicProvinceTrend,
  getPublicProvinceTrendCached,
  type PublicForecastRow,
} from "../shared/api/provinceSummaryCache";
import "./HeroForecast.css";

type RiskClass = "rendah" | "sedang" | "tinggi" | "sangat_tinggi";
const SCALE: RiskClass[] = ["rendah", "sedang", "tinggi", "sangat_tinggi"];

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function worstClass(row: PublicForecastRow): RiskClass {
  const critical = num(row.critical_count);
  const highRisk = num(row.high_risk_count);
  if (critical > 0) return "sangat_tinggi";
  if (highRisk > critical) return "tinggi";
  if (num(row.medium_count) > 0) return "sedang";
  return "rendah";
}

/** "2026-11-23" → Date lokal (tanpa geser zona waktu). */
function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function HeroForecast() {
  const [rows, setRows] = useState<PublicForecastRow[] | null>(getPublicProvinceTrendCached());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPublicProvinceTrend()
      .then((data) => { if (alive) setRows(data); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  if (failed || !rows || rows.length === 0) return null;

  const days = rows.slice(0, 7).map((row) => {
    const date = parseDate(row.prediction_date);
    const risk = worstClass(row);
    return {
      key: row.prediction_date,
      date,
      risk,
      peak: Math.round(num(row.max_probability)),
      highRisk: num(row.high_risk_count),
      critical: num(row.critical_count),
      regions: num(row.region_count),
    };
  });

  const now = new Date();
  const today = days.find((d) => sameDay(d.date, now)) ?? days[0];
  const todayIsToday = sameDay(today.date, now);
  const dayName = (day: (typeof days)[number], capital = false) =>
    sameDay(day.date, now)
      ? capital ? "Hari ini" : "hari ini"
      : day.date.toLocaleDateString("id-ID", { weekday: "long" });

  // Sorotan minggu ini: hari dengan kelas terburuk; bila semuanya di bawah
  // "tinggi", sebutkan hari dengan peluang tertinggi.
  const rank = (risk: RiskClass) => SCALE.indexOf(risk);
  const worst = days.reduce((a, b) =>
    rank(b.risk) > rank(a.risk) || (rank(b.risk) === rank(a.risk) && b.peak > a.peak) ? b : a,
  );
  const maxPeak = Math.max(...days.map((d) => d.peak));
  const peakIdx = days.map((d, i) => (d.peak === maxPeak ? i : -1)).filter((i) => i >= 0);
  const consecutive = peakIdx.every((v, i) => i === 0 || v === peakIdx[i - 1] + 1);
  const peakDays =
    peakIdx.length === 1
      ? dayName(days[peakIdx[0]], true)
      : consecutive
        ? `${dayName(days[peakIdx[0]], true)}–${dayName(days[peakIdx[peakIdx.length - 1]])}`
        : peakIdx.slice(0, 3).map((i) => dayName(days[i], true)).join(", ");

  const dateLabel = today.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="hf" aria-label="Prakiraan banjir rob 7 hari">
      <header className="hf-head">
        <div className="hf-status">
          <span className="hf-eyebrow">Prakiraan rob · 7 hari</span>
          <p className="hf-today">
            <span className="hf-today-label">{todayIsToday ? "Hari ini" : dateLabel}</span>
            <strong style={{ color: riskColors[today.risk] }}>{riskLabels[today.risk]}</strong>
          </p>
          <p className="hf-meta">
            Peluang tertinggi <b>{today.peak}%</b>
            {today.regions > 0 && <> · {today.regions.toLocaleString("id-ID")} kelurahan terpantau</>}
            {today.highRisk > 0 && (
              <> · <b style={{ color: riskColors[today.risk] }}>{today.highRisk.toLocaleString("id-ID")} berisiko tinggi</b></>
            )}
          </p>
        </div>
        <a className="hf-link" href="#/map">
          Lihat di peta <Icon name="arrow_forward" />
        </a>
      </header>

      <ol className="hf-days">
        {days.map((day, index) => {
          const isToday = day === today;
          return (
            <li
              key={day.key}
              className={`hf-tile${isToday ? " is-today" : ""}`}
              style={{ ["--hf-color" as string]: riskColors[day.risk], ["--hf-i" as string]: index }}
              title={`${day.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}: ${riskLabels[day.risk]}, peluang tertinggi ${day.peak}%`}
            >
              <span className="hf-dow">
                {isToday && todayIsToday ? "Hari ini" : day.date.toLocaleDateString("id-ID", { weekday: "short" })}
              </span>
              <span className="hf-pct">
                {day.peak}
                <small>%</small>
              </span>
              <span className="hf-cls">{riskLabels[day.risk]}</span>
              <span className="hf-date">
                {day.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="hf-legend">
        <span className="hf-week">
          {rank(worst.risk) >= rank("tinggi") ? (
            <>
              <Icon name="warning" />
              Waspada {dayName(worst)}: {worst.highRisk.toLocaleString("id-ID")} kelurahan berisiko tinggi
              {worst.critical > 0 && <> ({worst.critical.toLocaleString("id-ID")} di antaranya sangat tinggi)</>}, peluang
              hingga {worst.peak}%.
            </>
          ) : (
            <>
              <Icon name="trending_up" />
              Tertinggi minggu ini: {peakDays}, {maxPeak}%.
            </>
          )}
        </span>
        <span className="hf-scale" aria-label="Skala kelas risiko">
          {SCALE.map((risk) => (
            <span key={risk}>
              <i style={{ background: riskColors[risk] }} />
              {riskLabels[risk]}
            </span>
          ))}
        </span>
      </footer>
    </section>
  );
}
