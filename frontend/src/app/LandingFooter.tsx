/**
 * Footer landing page: kolom brand + kontak, dua kolom tautan, dan baris hak
 * cipta dengan tombol kembali ke atas. Isinya hanya tautan & kontak yang sudah
 * ada di landing — tidak menambah halaman baru.
 */
import { Icon } from "../shared/components/Icon";
import "./LandingFooter.css";

interface LandingFooterProps {
  accessHref: string;
  accessLabel: string;
}

const EMAIL = "tanggap@bpbd.lampungprov.go.id";
const PHONE_DISPLAY = "(0721) 123456";
const PHONE_HREF = "tel:+62721123456";

/**
 * Ombak sinus dengan periode 720 unit di kanvas 2880 unit (= 2× lebar
 * tampilan). SVG dilebarkan 200% lalu digeser -50% dalam loop CSS, jadi
 * gerakannya mulus tanpa sambungan.
 */
function wavePath(baseline: number, amplitude: number, filled: boolean): string {
  const segments = ` t360 0`.repeat(7);
  const line = `M0 ${baseline} q180 ${-amplitude} 360 0${segments}`;
  return filled ? `${line} V160 H0 Z` : line;
}

// Garis buih tipis tepat di atas ombak: makin ke atas makin samar (lihat
// mask di CSS), mengalir bersama lapisan ombak di bawahnya.
const FOAM_LINES = [
  { y: 34, amp: 18, speed: 46, reverse: true },
  { y: 62, amp: 22, speed: 32, reverse: false },
  { y: 88, amp: 16, speed: 24, reverse: true },
];

// Bintang di langit kanan (posisi % di dalam kolom langit, ukuran px).
// Sengaja sedikit & samar; hanya dua yang berkelip pelan.
const STARS = [
  { x: 30, y: 20, size: 2, twinkle: false },
  { x: 46, y: 8, size: 1.5, twinkle: true },
  { x: 58, y: 30, size: 1.5, twinkle: false },
  { x: 38, y: 42, size: 1, twinkle: false },
  { x: 86, y: 26, size: 2, twinkle: false },
  { x: 70, y: 52, size: 1, twinkle: false },
  { x: 92, y: 44, size: 1.5, twinkle: true },
  { x: 50, y: 60, size: 1, twinkle: false },
];

// Lapisan ombak berisi di dasar footer, dari belakang ke depan.
const SWELLS = [
  { cls: "lf-swell-back", base: 70, amp: 26 },
  { cls: "lf-swell-mid", base: 92, amp: 20 },
  { cls: "lf-swell-front", base: 112, amp: 16 },
];

export function LandingFooter({ accessHref, accessLabel }: LandingFooterProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="lf">
      <div className="lf-sea" aria-hidden="true">
        <div className="lf-foam">
          {FOAM_LINES.map((line) => (
            <svg key={line.y} viewBox="0 0 2880 40" preserveAspectRatio="none"
              style={{ top: line.y, animationDuration: `${line.speed}s`, animationDirection: line.reverse ? "reverse" : "normal" }}>
              <path d={wavePath(20, line.amp, false)} />
            </svg>
          ))}
        </div>
        <div className="lf-sky">
          {STARS.map((star) => (
            <span
              key={`${star.x}-${star.y}`}
              className={`lf-star${star.twinkle ? " is-twinkling" : ""}`}
              style={{ left: `${star.x}%`, top: `${star.y}%`, width: star.size, height: star.size }}
            />
          ))}
          <svg className="lf-moon" viewBox="0 0 40 40">
            <defs>
              <mask id="lf-moon-cut">
                <rect width="40" height="40" fill="#fff" />
                <circle cx="27" cy="15" r="13" fill="#000" />
              </mask>
            </defs>
            <circle className="lf-moon-disc" cx="20" cy="20" r="14" mask="url(#lf-moon-cut)" />
          </svg>

        </div>
        <svg className="lf-lighthouse" viewBox="0 0 80 170">
          <defs>
            <radialGradient id="lf-lamp-glow">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="lf-lamp-glow" cx="40" cy="49" r="30" fill="url(#lf-lamp-glow)" />
          <path className="lf-lh-rock" d="M2 170 Q8 150 22 147 Q34 141 48 145 Q64 148 76 170 Z" />
          <path className="lf-lh-body" d="M28 147 L32.5 62 H47.5 L52 147 Z" />
          <path className="lf-lh-stripe" d="M31.5 84 H48.5 L49.2 98 H30.8 Z M30.2 112 H49.8 L50.5 126 H29.5 Z" />
          <rect className="lf-lh-body" x="27" y="57" width="26" height="5" rx="1" />
          <rect className="lf-lh-glass" x="33" y="43" width="14" height="14" rx="1" />
          <circle className="lf-lh-lamp" cx="40" cy="50" r="3.2" />
          <path className="lf-lh-body" d="M30.5 43 L40 32 L49.5 43 Z" />
          <path className="lf-lh-band" d="M40 32 V27" />
        </svg>
        {SWELLS.map((swell) => (
          <svg key={swell.cls} className={`lf-swell ${swell.cls}`} viewBox="0 0 2880 160" preserveAspectRatio="none">
            <path d={wavePath(swell.base, swell.amp, true)} />
          </svg>
        ))}
      </div>

      <div className="lf-inner">
        <div className="lf-brand">
          <a className="lf-logo" href="#/">
            <img src="/logo.png" alt="" width="52" height="52" />
            <span>SAIBAR</span>
          </a>
          <p className="lf-tagline">Sistem Informasi Risiko Banjir Rob Terpadu Provinsi Lampung.</p>

          <address className="lf-contact">
            <strong>Pusdalops BPBD Provinsi Lampung</strong>
            <span>Jl. Beringin Raya No. 1, Teluk Betung, Bandar Lampung</span>
            <span>
              Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </span>
            <span>
              Telepon: <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
            </span>
          </address>

          <div className="lf-socials">
            <a href={`mailto:${EMAIL}`} aria-label="Kirim email ke Pusdalops BPBD" title="Email">
              <Icon name="mail" />
            </a>
            <a href={PHONE_HREF} aria-label="Telepon Pusdalops BPBD" title="Telepon">
              <Icon name="call" />
            </a>
          </div>
        </div>

        <nav className="lf-col" aria-label="Tautan">
          <h3>Tautan</h3>
          <a href="#/">Beranda</a>
          <a href="#/map">Peta Risiko</a>
          <a href="#/awam">Mode Awam</a>
          <a href="#panduan">Panduan</a>
        </nav>

        <nav className="lf-col" aria-label="Akses">
          <h3>Akses</h3>
          <a href="#/onboarding">Panduan Mitigasi</a>
          <a href={accessHref}>{accessLabel}</a>
        </nav>
      </div>

      <div className="lf-bottom">
        <span>&copy; 2026 SAIBAR · Institut Teknologi Sumatera</span>
        <button type="button" className="lf-top" onClick={scrollToTop} aria-label="Kembali ke atas">
          <Icon name="keyboard_arrow_up" />
        </button>
      </div>
    </footer>
  );
}
