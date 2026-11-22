import { useState } from "react";
import { riskColors, riskLabels } from "../../shared/constants/risk";
import type { RiskClass } from "../../shared/types/domain";

const examples: { risk: RiskClass; percent: number; explanation: string }[] = [
  { risk: "rendah", percent: 20, explanation: "Peluang pada contoh ini lebih kecil. Tetap periksa pembaruan sebelum beraktivitas di pesisir." },
  { risk: "sedang", percent: 45, explanation: "Peluang pada contoh ini meningkat. Perhatikan kondisi sekitar dan pembaruan informasi." },
  { risk: "tinggi", percent: 65, explanation: "Peluang pada contoh ini lebih besar. Tingkatkan kewaspadaan dan ikuti arahan petugas setempat." },
  { risk: "sangat_tinggi", percent: 85, explanation: "Contoh ini menunjukkan kelas risiko tertinggi. Utamakan keselamatan dan ikuti arahan BPBD." },
];

export function GuideRiskExample() {
  const [selected, setSelected] = useState<RiskClass>("tinggi");
  const example = examples.find((item) => item.risk === selected) ?? examples[2];
  return (
    <div className="guide-lesson">
      <div className="guide-lesson-head"><strong>Coba baca penanda di peta</strong><span>Contoh untuk belajar</span></div>
      <div className="guide-lesson-body">
        <div className="guide-example-map" aria-hidden="true">
          <svg viewBox="0 0 440 290" preserveAspectRatio="xMidYMid slice">
            <rect width="440" height="290" fill="var(--guide-water)" />
            <path d="M0 0H299C268 43 335 63 282 103S315 164 254 199S277 249 220 290H0Z" fill="var(--surface-soft)" />
            <g fill="none" stroke="var(--guide-map-road)" strokeWidth="9" strokeLinejoin="round">
              <path d="M-20 83L86 112L173 73L290 86M77-10L90 110L57 211L126 300M-20 221L156 198L258 236M181-10L168 75L203 166L158 200L191 300" />
            </g>
            <g fill="var(--guide-map-building)">
              <rect x="110" y="122" width="26" height="21" rx="3" /><rect x="144" y="119" width="20" height="31" rx="3" />
              <rect x="116" y="155" width="48" height="23" rx="3" /><rect x="33" y="135" width="30" height="24" rx="3" />
              <rect x="107" y="32" width="35" height="24" rx="3" /><rect x="213" y="107" width="27" height="20" rx="3" />
              <rect x="88" y="235" width="36" height="25" rx="3" /><rect x="12" y="241" width="30" height="18" rx="3" />
            </g>
            <g fill="none" stroke="var(--guide-map-wave)" strokeWidth="2" strokeLinecap="round">
              <path d="M343 55q10-8 20 0t20 0M343 63q10-8 20 0t20 0M321 210q10-8 20 0t20 0M321 218q10-8 20 0t20 0" />
            </g>
            <circle cx="235" cy="162" r="49" fill={riskColors[example.risk]} opacity=".12" />
            <circle cx="235" cy="162" r="32" fill="var(--surface)" stroke={riskColors[example.risk]} strokeWidth="3" />
            <text x="235" y="169" textAnchor="middle" fill="var(--ink)" fontSize="21" fontWeight="650" fontFamily="inherit">{example.percent}%</text>
          </svg>
          <span>Ilustrasi wilayah pesisir</span>
        </div>
        <div className="guide-example-reading" aria-live="polite" aria-atomic="true">
          <span className="guide-example-label">Peluang rob pada contoh</span>
          <div className="guide-example-value"><strong>{example.percent}<small>%</small></strong><span><i style={{ background: riskColors[example.risk] }} />{riskLabels[example.risk]}</span></div>
          <p>{example.explanation}</p>
          <p className="guide-example-clarification">Angka ini menunjukkan <strong>peluang kejadian</strong>, bukan tinggi air atau luas daerah yang tergenang.</p>
        </div>
      </div>
      <div className="guide-example-picker" role="group" aria-label="Pilih contoh kelas risiko">
        {examples.map((item) => <button type="button" key={item.risk} aria-pressed={selected === item.risk} onClick={() => setSelected(item.risk)}>
          <i style={{ background: riskColors[item.risk] }} />{riskLabels[item.risk]}
        </button>)}
      </div>
      <p className="guide-example-note">Pilih warna untuk mencoba. Angka di atas adalah contoh, bukan prediksi saat ini.</p>
    </div>
  );
}
