/**
 * ThemeToggle — saklar tema berbentuk pil bergambar pemandangan pantai.
 *
 * Terang: langit biru, matahari (knob) di kiri, perahu layar & pulau kelapa.
 * Gelap: langit malam berbintang, bulan berkawah (knob) bergulir ke kanan,
 * perahu berlayar ke sisi kiri. Ombak dan perahu bergerak pelan terus-menerus.
 */
import type { MouseEvent } from "react";
import type { ThemeOrigin } from "../utils/useTheme";
import "./ThemeToggle.css";

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: (origin?: ThemeOrigin) => void;
  className?: string;
}

// Ombak berulang dengan periode 16 unit; digeser 16 unit dalam loop CSS
// sehingga tampak mengalir tanpa sambungan.
const wavePath = (baseline: number, amplitude: number) =>
  `M-16 ${baseline} q4 ${-amplitude} 8 0${" t8 0".repeat(12)} V32 H-16 Z`;

const STARS: Array<[number, number, number, number]> = [
  // x, y, r, delay(s)
  [7, 7, 0.9, 0],
  [14, 13, 0.6, 0.8],
  [20, 5, 0.75, 1.6],
  [27, 11, 0.55, 0.4],
  [33, 4.5, 0.7, 1.2],
  [10, 18, 0.5, 2],
  [30, 17, 0.45, 0.6],
];

export function ThemeToggle({ isDark, onToggle, className }: ThemeToggleProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onToggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={isDark ? "Mode terang" : "Mode gelap"}
      className={`theme-toggle${className ? ` ${className}` : ""}`}
      data-mode={isDark ? "dark" : "light"}
      onClick={handleClick}
    >
      <span className="tt-sky tt-sky-night" aria-hidden="true" />

      <svg className="tt-scene" viewBox="0 0 68 32" width="68" height="32" aria-hidden="true">
        <g className="tt-stars">
          {STARS.map(([x, y, r, delay]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} style={{ animationDelay: `${delay}s` }} />
          ))}
        </g>

        <g className="tt-cloud">
          <circle cx="37" cy="8" r="2.6" />
          <circle cx="40.2" cy="6.6" r="3.2" />
          <circle cx="43.4" cy="8.2" r="2.4" />
          <rect x="37" y="8" width="6.4" height="2.6" rx="1.3" />
        </g>

        <g className="tt-wave tt-wave-back">
          <path d={wavePath(23.5, 1.4)} />
        </g>

        <g className="tt-island">
          <ellipse cx="59" cy="24.2" rx="5.4" ry="1.8" className="tt-sand" />
          <path d="M58.6 24 q-0.6 -4.2 1.4 -8" className="tt-trunk" />
          <path d="M60 16 q-3.2 -1.6 -5.6 0.9 M60 16 q3.1 -1.8 5.6 0.7 M60 16 q-1.6 -2.9 -4.2 -2.7 M60 16 q1.9 -2.9 4.3 -2"
            className="tt-leaves" />
        </g>

        <g className="tt-boat">
          <g className="tt-boat-bob">
            <path d="M0 -0.6 V-11.5 L5 -0.6 Z" className="tt-sail" />
            <path d="M-0.8 -0.6 V-8.5 L-4.4 -0.6 Z" className="tt-sail tt-sail-jib" />
            <path d="M-6 0 H6 L4.2 2.6 H-4.2 Z" className="tt-hull" />
          </g>
        </g>

        <g className="tt-wave tt-wave-front">
          <path d={wavePath(26.4, 1.1)} />
        </g>
      </svg>

      <span className="tt-knob" aria-hidden="true">
        <span className="tt-crater tt-crater-1" />
        <span className="tt-crater tt-crater-2" />
        <span className="tt-crater tt-crater-3" />
      </span>
    </button>
  );
}
