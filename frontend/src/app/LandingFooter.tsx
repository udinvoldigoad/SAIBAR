/**
 * Footer landing page: ilustrasi pesisir (FooterScene) yang turun ke laut
 * dalam, lalu kolom brand + kontak, dua kolom tautan, dan baris hak cipta
 * dengan tombol kembali ke atas. Isinya hanya tautan & kontak yang sudah
 * ada di landing — tidak menambah halaman baru.
 */
import { Icon } from "../shared/components/Icon";
import { FooterScene } from "./FooterScene";
import { scrollToLandingGuide } from "./landingMotion";
import "./LandingFooter.css";

interface LandingFooterProps {
  accessHref: string;
  accessLabel: string;
}

const EMAIL = "tanggap@bpbd.lampungprov.go.id";
const PHONE_DISPLAY = "(0721) 123456";
const PHONE_HREF = "tel:+62721123456";

export function LandingFooter({ accessHref, accessLabel }: LandingFooterProps) {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

  return (
    <footer className="lf">
      <FooterScene />

      <div className="lf-body">
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
            <a href="#panduan" onClick={scrollToLandingGuide}>Panduan</a>
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
      </div>
    </footer>
  );
}
