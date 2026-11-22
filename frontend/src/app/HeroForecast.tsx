/**
 * Prakiraan rob 7 hari di hero landing — "tabel pasang-surut" mini.
 *
 * Tiap hari satu batang: tinggi = peluang rob tertinggi di antara kelurahan
 * terpantau, warna = kelas risiko terburuk hari itu (palet yang sama dengan
 * peta). Datanya dari /public/province/forecast (anonim). Bila gagal dimuat
 * atau kosong, komponen tidak merender apa pun — tidak ada angka karangan.
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
      regions: num(row.region_count),
    };
  });

  const now = new Date();
  const today = days.find((d) => sameDay(d.date, now)) ?? days[0];
  const todayIsToday = sameDay(today.date, now);
  const dayLabel = todayIsToday
    ? "Hari ini"
    : today.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="hf" aria-label="Prakiraan banjir rob 7 hari">
      <header className="hf-head">
        <div>
          <span className="hf-eyebrow">Prakiraan rob · 7 hari</span>
          <p className="hf-summary">
            {today.highRisk > 0 ? (
              <>
                {dayLabel}{" "}
                <strong style={{ color: riskColors[today.risk] }}>
                  {today.highRisk.toLocaleString("id-ID")}
                  {today.regions > 0 && <> dari {today.regions.toLocaleString("id-ID")}</>} kelurahan
                </strong>{" "}
                terpantau berisiko tinggi, dengan peluang tertinggi <strong>{today.peak}%</strong>.
              </>
            ) : (
              <>
                {dayLabel} tidak ada kelurahan berisiko tinggi. Peluang tertinggi
                {today.regions > 0 && <> di {today.regions.toLocaleString("id-ID")} kelurahan terpantau</>}:{" "}
                <strong>{today.peak}%</strong>.
              </>
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
              className={`hf-day${isToday ? " is-today" : ""}`}
              style={{ ["--hf-color" as string]: riskColors[day.risk], ["--hf-i" as string]: index }}
              title={`${day.date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}: ${riskLabels[day.risk]}, peluang tertinggi ${day.peak}%`}
            >
              <span className="hf-dow">
                {isToday && todayIsToday ? "Hari ini" : day.date.toLocaleDateString("id-ID", { weekday: "short" })}
              </span>
              <span className="hf-bar" aria-hidden="true">
                <span className="hf-fill" style={{ height: `${Math.max(day.peak, 4)}%` }} />
              </span>
              <span className="hf-val">{day.peak}%</span>
              <span className="hf-date">
                {day.date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
            </li>
          );
        })}
      </ol>

      <footer className="hf-legend">
        <span className="hf-legend-note">Tinggi batang = peluang tertinggi · warna = kelas risiko terburuk</span>
        <span className="hf-scale">
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
