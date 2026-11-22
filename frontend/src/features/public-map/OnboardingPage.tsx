import { useEffect, useState, type MouseEvent } from "react";
import { AppShell } from "../../shared/components/AppShell";
import { Icon } from "../../shared/components/Icon";
import { getCurrentUser, isLoggedIn } from "../../shared/auth/session";
import { GuideRiskExample } from "./GuideRiskExample";
import "./onboardingGuide.css";

const contents = [
  { id: "guide-reading", label: "Baca peta", icon: "map" },
  { id: "guide-preparedness", label: "Siapkan diri", icon: "shield" },
  { id: "guide-reporting", label: "Kirim laporan", icon: "edit_note" },
  { id: "guide-questions", label: "Tanya jawab", icon: "help_outline" },
];

const preparation = {
  before: [
    "Cek pembaruan cuaca dan peringatan rob dari BMKG.",
    "Simpan dokumen dan barang penting di tempat yang lebih tinggi.",
    "Perhatikan arahan BPBD setempat sebelum beraktivitas di pesisir.",
  ],
  during: [
    "Utamakan keselamatan dan ikuti arahan petugas setempat.",
    "Jangan menerobos arus air atau berkendara melewati banjir.",
    "Jangan menyentuh peralatan listrik saat berdiri di genangan.",
  ],
};

const questions = [
  { q: "Apakah 0% berarti pasti aman?", a: "Tidak. Angka yang tampil adalah hasil prediksi untuk wilayah dan tanggal yang dipilih, bukan jaminan tidak terjadi rob. Tetap periksa pembaruan, kondisi sekitar, dan arahan BPBD." },
  { q: "Apa bedanya Mode Awam dan Peta Risiko?", a: "Mode Awam memberi ringkasan risiko dan langkah yang mudah dipahami untuk suatu lokasi. Peta Risiko membantu Anda menjelajahi wilayah, mengganti tanggal prediksi, dan memilih lapisan peta." },
  { q: "Mengapa lokasi saya belum ada datanya?", a: "Lokasi bisa berada di luar wilayah pantauan, atau prediksi untuk tanggal tersebut belum tersedia. Coba pilih wilayah atau tanggal lain di Peta Risiko. Belum ada data tidak berarti wilayah tersebut pasti aman." },
  { q: "Apakah saya perlu masuk akun?", a: "Anda dapat melihat peta, Mode Awam, dan panduan tanpa masuk akun. Untuk mengirim laporan kejadian, Anda perlu masuk terlebih dahulu." },
  { q: "Kapan laporan saya muncul di peta?", a: "Laporan diperiksa oleh petugas terlebih dahulu. Setelah divalidasi, laporan dapat ditampilkan di peta. Pengguna yang sudah masuk dapat mengecek status laporannya melalui menu Riwayat Laporan." },
];

export function OnboardingPage() {
  const [activeSection, setActiveSection] = useState(contents[0].id);
  const [phase, setPhase] = useState<keyof typeof preparation>("before");
  const loggedIn = isLoggedIn();
  const user = getCurrentUser();
  const canViewHistory = loggedIn && !!user && ["warga", "admin"].includes(user.role);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveSection(visible[0].target.id);
    }, { rootMargin: "-96px 0px -55% 0px", threshold: 0 });
    contents.forEach(({ id }) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    const initialSection = new URLSearchParams(window.location.hash.split("?")[1]).get("bagian");
    let frame = 0;
    if (initialSection && contents.some(({ id }) => id === initialSection)) frame = requestAnimationFrame(() => document.getElementById(initialSection)?.scrollIntoView({ block: "start" }));
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  const goToSection = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    setActiveSection(id);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <AppShell active="onboarding" title="Panduan" className="guide-app-shell">
      <div className="guide-page">
        <header className="guide-intro">
          <h1>Kenali rob,<br />ketahui langkahnya.</h1>
          <div>
            <p>Mulai dari lokasi Anda. Pelajari cara membaca risiko, menyiapkan diri, dan melaporkan genangan dengan aman.</p>
            <div className="guide-intro-actions">
              <a className="guide-button primary" href="#/awam"><Icon name="my_location" />Cek lokasi saya</a>
              <a className="guide-button" href="#/map">Buka peta<Icon name="arrow_forward" /></a>
            </div>
          </div>
        </header>

        <div className="guide-rob-note"><Icon name="waves" /><p><strong>Apa itu rob?</strong> Rob terjadi ketika air laut meluap dan menggenangi daratan di wilayah pesisir.</p></div>

        <div className="guide-layout">
          <nav className="guide-index" aria-label="Isi panduan">
            <span>Dalam panduan ini</span>
            {contents.map((item) => <a key={item.id} href={`#/onboarding?bagian=${item.id}`} onClick={(event) => goToSection(event, item.id)} aria-current={activeSection === item.id ? "location" : undefined}>
              <Icon name={item.icon} />{item.label}
            </a>)}
          </nav>

          <div className="guide-articles">
            <section id="guide-reading" className="guide-section" tabIndex={-1} aria-labelledby="guide-reading-title">
              <header className="guide-section-head"><h2 id="guide-reading-title">Baca peta, pahami risikonya</h2><p>Warna menunjukkan kelas risiko. Angka persentase menunjukkan peluang terjadinya rob.</p></header>
              <GuideRiskExample />
              <ol className="guide-reading-steps">
                <li><strong>Pilih wilayah Anda</strong><p>Buka Peta Risiko, lalu pilih kabupaten atau sentuh penanda wilayah. Gunakan “Lokasi saya” jika Anda ingin mencari wilayah terdekat.</p></li>
                <li><strong>Periksa tanggal dan pembaruan</strong><p>Pastikan Anda membaca prediksi untuk tanggal yang diinginkan. Jika data belum diperbarui, perhatikan pemberitahuan di peta.</p></li>
                <li><strong>Baca risikonya bersama kondisi sekitar</strong><p>Prediksi membantu Anda bersiap. Jika air sudah naik, utamakan kondisi di lapangan dan arahan petugas.</p></li>
              </ol>
              <a className="guide-text-link" href="#/map">Coba langsung di Peta Risiko<Icon name="arrow_forward" /></a>
            </section>

            <section id="guide-preparedness" className="guide-section" tabIndex={-1} aria-labelledby="guide-preparedness-title">
              <header className="guide-section-head"><h2 id="guide-preparedness-title">Bersiap sebelum air naik</h2><p>Langkah sederhana untuk menjaga diri dan keluarga. Selalu sesuaikan dengan arahan BPBD setempat.</p></header>
              <div className="guide-preparation">
                <div className="guide-phase-picker" role="group" aria-label="Pilih kondisi">
                  <button type="button" aria-pressed={phase === "before"} onClick={() => setPhase("before")}>Sebelum air naik</button>
                  <button type="button" aria-pressed={phase === "during"} onClick={() => setPhase("during")}>Saat ada genangan</button>
                </div>
                <ul className="guide-safety-list" aria-live="polite" aria-atomic="true">{preparation[phase].map((item) => <li key={item}><Icon name="check" /><span>{item}</span></li>)}</ul>
                <p className="guide-safety-reminder"><Icon name="info" />Kirim laporan setelah Anda berada di tempat aman. Jangan mengambil foto jika membahayakan diri.</p>
              </div>
              <p className="guide-sources">Rujukan: <a href="https://bnpb.go.id/berita/banjir" target="_blank" rel="noopener noreferrer">Panduan banjir BNPB<Icon name="open_in_new" /></a> dan <a href="https://www.bmkg.go.id/peringatan-dini/banjir-pesisir" target="_blank" rel="noopener noreferrer">Peringatan rob BMKG<Icon name="open_in_new" /></a>.</p>
            </section>

            <section id="guide-reporting" className="guide-section" tabIndex={-1} aria-labelledby="guide-reporting-title">
              <header className="guide-section-head"><h2 id="guide-reporting-title">Melihat genangan? Bantu laporkan.</h2><p>Laporan Anda membantu petugas mengetahui kondisi di lapangan. Cukup ceritakan apa yang Anda lihat.</p></header>
              <ol className="guide-report-steps">
                <li><div><h3>Tandai lokasi kejadian</h3><p>Letakkan pin pada lokasi genangan. Periksa kembali nama wilayah dan titiknya sebelum melanjutkan.</p></div></li>
                <li><div><h3>Ceritakan kondisi yang Anda lihat</h3><p>Isi waktu kejadian, perkiraan tinggi air dalam sentimeter, dan deskripsi singkat. Keparahan dihitung otomatis dari tinggi air. Perkirakan dari tempat yang aman.</p></div></li>
                <li><div><h3>Tambahkan foto, lalu kirim</h3><p>Gunakan foto yang diambil dengan aman. Periksa isian dan kirim laporan, lalu simpan kode laporan untuk mengecek statusnya.</p></div></li>
              </ol>
              <div className="guide-report-actions"><a className="guide-button primary" href={loggedIn ? "#/reports" : "#/login"}><Icon name="add_location_alt" />{loggedIn ? "Buat laporan" : "Masuk untuk melapor"}</a>{canViewHistory && <a className="guide-text-link" href="#/history">Lihat riwayat laporan<Icon name="arrow_forward" /></a>}</div>
              <p className="guide-report-hint">Laporan ditinjau oleh petugas sebelum ditampilkan di peta.</p>
            </section>

            <section id="guide-questions" className="guide-section" tabIndex={-1} aria-labelledby="guide-questions-title">
              <header className="guide-section-head"><h2 id="guide-questions-title">Masih ada yang ingin diketahui?</h2><p>Jawaban singkat untuk pertanyaan yang sering muncul.</p></header>
              <div className="guide-faq">{questions.map(({ q, a }) => <details key={q}><summary><span>{q}</span><Icon name="expand_more" /></summary><p>{a}</p></details>)}</div>
              <div className="guide-finish"><Icon name="explore" /><div><h3>Mulai dari kondisi di sekitar Anda</h3><p>Mode Awam merangkum risiko dan langkah yang perlu diperhatikan.</p></div><a className="guide-button" href="#/awam">Buka Mode Awam<Icon name="arrow_forward" /></a></div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
