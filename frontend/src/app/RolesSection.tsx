/**
 * Section "Satu sistem, tiga peran" di landing: Warga, Peneliti, Pengelola.
 * Setiap kartu hanya menampilkan fitur yang memang ada di aplikasi
 * (lihat app/navigation.ts dan routes/api.php) — tidak ada angka karangan.
 * Memakai kelas bento global yang didefinisikan di PortalPage.
 */
import { motion } from "framer-motion";
import { LandingHeading, useLandingReveal } from "./landingMotion";
import { Icon } from "../shared/components/Icon";
import { MapPreview } from "../shared/components/MapPreview";
import "./RolesSection.css";

interface RolesSectionProps {
  /** Tujuan tautan kartu peneliti (Arsip Data bila berhak, selain itu login). */
  researchHref: string;
  /** Tujuan tautan kartu pengelola (dashboard admin bila berhak, selain itu login). */
  adminHref: string;
  adminLabel: string;
}

const CITIZEN_FEATURES = [
  { icon: "map", label: "Peta Risiko", hint: "Peluang rob per kelurahan", href: "#/map" },
  { icon: "person_pin_circle", label: "Cek Lokasi Saya", hint: "Risiko di titik Anda", href: "#/awam" },
  { icon: "add_location_alt", label: "Lapor Kejadian", hint: "Kirim foto & tinggi air", href: "#/reports" },
  { icon: "help", label: "Panduan Mitigasi", hint: "Langkah sebelum & saat rob", href: "#/onboarding" },
];

const ADMIN_FEATURES = [
  { icon: "assignment_turned_in", label: "Antrean validasi laporan" },
  { icon: "monitoring", label: "Pantauan provinsi" },
  { icon: "manage_accounts", label: "Pengguna & perizinan" },
  { icon: "policy", label: "Log audit" },
];

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RolesSection({ researchHref, adminHref, adminLabel }: RolesSectionProps) {
  const reveal = useLandingReveal();
  return (
    <section className="bento-section roles-section">
      <div className="bento-header-wrap">
        <LandingHeading text="Satu sistem, tiga peran" />
        <p>
          Warga, peneliti, dan pengelola memakai data prediksi yang sama — masing-masing dengan akses sesuai
          kebutuhannya.
        </p>
      </div>

      <div className="bento-container-grid">
        {/* Warga */}
        <motion.div {...reveal()} className="bento-card-el roles-card-wide">
          <div className="roles-wide-grid">
            <span className="card-meta-title">Untuk warga &amp; publik</span>
            <h3>Peta risiko &amp; laporan warga</h3>
            <p>
              Lihat peluang rob harian di kelurahan pesisir, cek kondisi di lokasi Anda, ikuti panduan keselamatan,
              dan laporkan genangan saat air mulai naik.
            </p>
            <div className="card-preview-container">
              <MapPreview />
            </div>
            <ul className="roles-features roles-features-links">
              {CITIZEN_FEATURES.map((feature) => (
                <li key={feature.label}>
                  <a href={feature.href}>
                    <Icon name={feature.icon} />
                    <span>
                      <strong>{feature.label}</strong>
                      <small>{feature.hint}</small>
                    </span>
                    <Icon name="arrow_forward" className="roles-feature-arrow" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Peneliti */}
        <motion.div {...reveal(0.1)} className="bento-card-el roles-card-side">
          <div>
            <span className="card-meta-title">Untuk peneliti</span>
            <h3>Arsip data &amp; API</h3>
            <p>
              Unduh dataset prediksi dan laporan tervalidasi yang sudah dianonimkan, atau tarik langsung lewat API
              dengan API key pribadi.
            </p>
            <div className="roles-code" aria-label="Contoh pemanggilan API">
              <div className="roles-code-bar">
                <i /><i /><i />
                <span>REST · JSON / CSV</span>
              </div>
              <pre>
                <span className="rc-method">GET</span> /api/v1/predictions/daily{"\n"}
                {"    "}?from=<span className="rc-val">{isoDate(0)}</span>&amp;to=<span className="rc-val">{isoDate(6)}</span>{"\n"}
                {"    "}&amp;format=<span className="rc-val">csv</span>{"\n"}
                <span className="rc-key">X-API-Key</span>: <span className="rc-muted">••••••••••••</span>
              </pre>
              <div className="roles-code-endpoints">
                <span>/v1/predictions/daily</span>
                <span>/v1/reports</span>
                <span>/v1/tidal</span>
              </div>
            </div>
          </div>
          <div className="card-links-row">
            <a className="card-action-link" href={researchHref}>Buka Arsip Data <Icon name="arrow_forward" /></a>
          </div>
        </motion.div>

        {/* Pengelola */}
        <motion.div {...reveal(0.2)} className="bento-card-el roles-card-side dark-theme">
          <div>
            <span className="card-meta-title">Untuk pengelola</span>
            <h3>Validasi &amp; pemantauan</h3>
            <p>
              Tim pengelola memvalidasi laporan warga, memantau prediksi lintas kabupaten, serta mengatur akun dan
              jejak audit.
            </p>
            <ul className="roles-features">
              {ADMIN_FEATURES.map((feature) => (
                <li key={feature.label}>
                  <Icon name={feature.icon} />
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card-links-row">
            <a className="card-action-link" href={adminHref}>{adminLabel} <Icon name="arrow_forward" /></a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
