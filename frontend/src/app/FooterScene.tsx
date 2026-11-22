/**
 * Latar ilustrasi pesisir untuk footer: langit (tempat isi footer berada),
 * awan & burung di atas cakrawala, kapal layar, mercusuar di atas karang, dan
 * ombak berlapis yang turun ke laut dalam (tempat baris hak cipta). Mode
 * terang = siang, mode gelap = malam (bulan, bintang, lampu mercusuar).
 *
 * Seluruh adegan menempel di dasar footer dengan ukuran px tetap, jadi tinggi
 * isi footer tidak mengubah posisi cakrawala. Ombak memakai SVG selebar 200%
 * yang digeser -50% agar mengalir tanpa sambungan.
 */
import "./FooterScene.css";

/** Ombak sinus periodik di kanvas 2880×100; periode harus membagi 1440. */
function wave(baseline: number, amplitude: number, halfPeriod: number): string {
  const repeats = 2880 / halfPeriod - 1;
  return `M0 ${baseline} q${halfPeriod / 2} ${-amplitude} ${halfPeriod} 0${` t${halfPeriod} 0`.repeat(repeats)}`;
}

const SEA_LAYERS = [
  { cls: "lf-sea-1", base: 34, amp: 30, half: 160, speed: 46, reverse: false },
  { cls: "lf-sea-2", base: 34, amp: 34, half: 120, speed: 32, reverse: true },
  { cls: "lf-sea-3", base: 36, amp: 30, half: 144, speed: 24, reverse: false },
  { cls: "lf-sea-4", base: 40, amp: 26, half: 120, speed: 18, reverse: true },
];

// Burung: posisi % di dalam adegan, skala, durasi melayang (detik).
const BIRDS = [
  { x: 5, y: 40, s: 1, d: 11 },
  { x: 9, y: 62, s: 0.7, d: 13 },
  { x: 41, y: 30, s: 0.85, d: 12 },
  { x: 47, y: 58, s: 0.65, d: 15 },
  { x: 56, y: 22, s: 1, d: 10 },
  { x: 62, y: 50, s: 0.7, d: 14 },
  { x: 74, y: 36, s: 0.8, d: 12 },
  { x: 95, y: 48, s: 0.9, d: 13 },
];

const STARS: Array<[number, number]> = [
  [8, 14], [17, 30], [26, 10], [33, 34], [41, 18], [52, 8], [58, 28],
  [66, 12], [74, 32], [79, 8], [88, 20], [95, 12],
];

/** Awan bertumpuk dengan dasar rata (gaya flat). */
function Cloud({ x, y, s, className }: { x: number; y: number; s: number; className: string }) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="0" cy="0" r="34" />
      <circle cx="40" cy="-22" r="46" />
      <circle cx="92" cy="-12" r="40" />
      <circle cx="132" cy="4" r="28" />
      <circle cx="-36" cy="12" r="24" />
      <rect x="-60" y="10" width="216" height="32" rx="16" />
    </g>
  );
}

export function FooterScene() {
  return (
    <div className="lf-scene" aria-hidden="true">
      <div className="lf-stars">
        {STARS.map(([x, y]) => (
          <span key={`${x}-${y}`} style={{ left: `${x}%`, top: `${y}%` }} />
        ))}
      </div>

      <svg className="lf-moon" viewBox="0 0 40 40">
        <defs>
          <mask id="lf-moon-cut">
            <rect width="40" height="40" fill="#fff" />
            <circle cx="27" cy="15" r="13" fill="#000" />
          </mask>
        </defs>
        <circle className="lf-moon-disc" cx="20" cy="20" r="14" mask="url(#lf-moon-cut)" />
      </svg>

      <div className="lf-clouds">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="xMidYMax slice">
          <Cloud x={30} y={150} s={0.62} className="lf-cloud-back" />
          <Cloud x={430} y={140} s={0.78} className="lf-cloud-back" />
          <Cloud x={820} y={148} s={0.68} className="lf-cloud-back" />
          <Cloud x={1180} y={136} s={0.82} className="lf-cloud-back" />
          <Cloud x={190} y={168} s={0.72} className="lf-cloud-front" />
          <Cloud x={620} y={170} s={0.64} className="lf-cloud-front" />
          <Cloud x={1000} y={166} s={0.76} className="lf-cloud-front" />
          <Cloud x={1340} y={172} s={0.66} className="lf-cloud-front" />
        </svg>
      </div>

      <div className="lf-birds">
        {BIRDS.map((bird) => (
          <svg
            key={`${bird.x}-${bird.y}`}
            className="lf-bird"
            viewBox="0 0 24 10"
            style={{
              left: `${bird.x}%`,
              top: `${bird.y}%`,
              width: 30 * bird.s,
              height: 12 * bird.s,
              animationDuration: `${bird.d}s`,
            }}
          >
            <path d="M1 3 Q6 1.5 12 8 Q18 1.5 23 3" />
          </svg>
        ))}
      </div>

      <div className="lf-horizon" />

      <svg className="lf-ship" viewBox="0 0 130 120">
        <g className="lf-ship-bob">
          <path className="lf-ship-rig" d="M58 14 V96 M86 30 V96 M58 14 L112 92 M30 90 L58 22" />
          <path className="lf-ship-flag" d="M58 14 L58 6 L68 10 Z" />
          <path className="lf-sail-a" d="M60 20 Q80 52 60 88 Z" />
          <path className="lf-sail-b" d="M88 34 Q104 62 88 90 Z" />
          <path className="lf-sail-c" d="M56 26 L34 86 L56 86 Z" />
          <path className="lf-sail-d" d="M90 36 L114 90 H90 Z" />
          <path className="lf-ship-hull" d="M14 94 H122 L110 112 H28 Z" />
          <path className="lf-ship-trim" d="M18 98 H119" />
        </g>
      </svg>

      <svg className="lf-lighthouse" viewBox="0 0 160 260">
        <defs>
          <clipPath id="lf-tower-clip">
            <path d="M58 214 L64 82 H96 L102 214 Z" />
          </clipPath>
          <radialGradient id="lf-lamp-glow">
            <stop offset="0%" stopColor="#ffe9a8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="lf-lamp-halo" cx="80" cy="58" r="46" fill="url(#lf-lamp-glow)" />
        <g clipPath="url(#lf-tower-clip)">
          <rect className="lf-lh-white" x="50" y="80" width="60" height="140" />
          <rect className="lf-lh-red" x="50" y="80" width="60" height="26" />
          <rect className="lf-lh-red" x="50" y="132" width="60" height="26" />
          <rect className="lf-lh-red" x="50" y="184" width="60" height="32" />
        </g>
        <path className="lf-lh-shade" d="M80 82 H96 L102 214 H80 Z" />
        <rect className="lf-lh-window" x="77" y="116" width="6" height="9" rx="3" />
        <rect className="lf-lh-window" x="77" y="166" width="6" height="9" rx="3" />
        <rect className="lf-lh-dark" x="56" y="74" width="48" height="8" rx="1.5" />
        <path className="lf-lh-rail" d="M58 74 V64 M66 74 V64 M74 74 V64 M86 74 V64 M94 74 V64 M102 74 V64 M56 64 H104" />
        <rect className="lf-lh-glass" x="66" y="46" width="28" height="20" rx="2" />
        <circle className="lf-lh-lamp" cx="80" cy="56" r="5" />
        <path className="lf-lh-red" d="M62 47 Q80 26 98 47 Z" />
        <path className="lf-lh-dark-line" d="M80 30 V20" />
        <circle className="lf-lh-dark" cx="80" cy="19" r="3" />
        <path
          className="lf-lh-rock"
          d="M4 260 Q10 232 34 224 Q46 206 66 210 Q84 200 102 210 Q124 206 136 222 Q156 230 158 260 Z"
        />
        <path className="lf-lh-rock-hi" d="M36 226 Q48 210 66 213 M104 212 Q122 210 132 222" />
      </svg>

      {SEA_LAYERS.map((layer) => (
        <svg
          key={layer.cls}
          className={`lf-sea ${layer.cls}`}
          viewBox="0 0 2880 100"
          preserveAspectRatio="none"
          style={{ animationDuration: `${layer.speed}s`, animationDirection: layer.reverse ? "reverse" : "normal" }}
        >
          <path className="lf-sea-body" d={`${wave(layer.base, layer.amp, layer.half)} V100 H0 Z`} />
          <path className="lf-sea-cap" d={wave(layer.base + 3, layer.amp, layer.half)} />
          <path className="lf-sea-foam" d={wave(layer.base, layer.amp, layer.half)} />
        </svg>
      ))}
    </div>
  );
}
