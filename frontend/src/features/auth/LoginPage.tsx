import { useState, useEffect } from "react";
import { Icon } from "../../shared/components/Icon";
import { InlineNotice } from "../../shared/components/InlineNotice";
import { api, apiUrl, ApiError, errorMessage } from "../../shared/api/client";
import { useToast } from "../../shared/components/Toast";
import { dashboardHashForRole } from "../../shared/constants/roles";
import { setSession } from "../../shared/auth/session";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ThemeToggleControl } from "../../shared/components/ThemeToggle";
import "./loginPage.css";

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

function GoogleMark() {
  return <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>;
}

function PasswordField({ id, value, onChange, visible, onToggle, registering = false }: {
  id: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; registering?: boolean;
}) {
  return <div className="auth-field">
    <div className="auth-label-row"><label htmlFor={id}>Kata sandi</label>{!registering && <a className="auth-text-link" href="#/forgot-password">Lupa sandi?</a>}</div>
    <div className="auth-password-control">
      <input id={id} name="password" type={visible ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={registering ? "Buat kata sandi" : "Masukkan kata sandi"} minLength={registering ? 8 : undefined} aria-describedby={registering ? `${id}-hint` : undefined} required />
      <button type="button" className="auth-password-toggle" onClick={onToggle} aria-label={visible ? "Sembunyikan sandi" : "Tampilkan sandi"} title={visible ? "Sembunyikan sandi" : "Tampilkan sandi"} aria-pressed={visible}><Icon name={visible ? "visibility_off" : "visibility"} /></button>
    </div>
    {registering && <p className="auth-field-hint" id={`${id}-hint`}>Gunakan minimal 8 karakter.</p>}
  </div>;
}

export function LoginPage() {
  const toast = useToast();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  // Email yang sedang menunggu verifikasi OTP (dari registrasi ATAU dari
  // login yang ditolak karena belum terverifikasi).
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginNotice, setLoginNotice] = useState<{ message: string; status?: string } | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error=menunggu")) {
      // Pendaftaran mandiri (email maupun Google) kini langsung aktif, jadi
      // status "menunggu" hanya muncul untuk akun yang SENGAJA dibuat admin
      // dalam keadaan menunggu — pesannya tak boleh lagi menyebut pendaftaran.
      setLoginNotice({ message: "Akun Anda masih menunggu persetujuan admin.", status: "menunggu" });
    } else if (hash.includes("error=nonaktif")) {
      setLoginNotice({ message: "Akun Anda telah dinonaktifkan.", status: "nonaktif" });
    } else if (hash.includes("error=ditolak")) {
      setLoginNotice({ message: "Pendaftaran Anda ditolak oleh admin.", status: "ditolak" });
    } else if (hash.includes("error=google_auth_failed") || hash.includes("error=oauth_failed")) {
      toast.error("Gagal masuk dengan Google.");
      window.location.hash = "#/login";
    }
  }, [toast]);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regInstitution, setRegInstitution] = useState("");
  // Jenis akun yang dimohon. Warga langsung aktif setelah verifikasi email;
  // peneliti berhenti di antrean admin karena perannya membuka data penelitian.
  const [accountType, setAccountType] = useState<"warga" | "peneliti">("warga");
  const [regPurpose, setRegPurpose] = useState("");
  // Diisi dari respons registrasi: menentukan apakah layar OTP menutup dengan
  // "silakan masuk" atau "menunggu persetujuan admin".
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const isPeneliti = accountType === "peneliti";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Email dan kata sandi wajib diisi.");
      return;
    }

    setIsLoading(true);
    setLoginNotice(null);
    try {
      const res = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setSession(res.user);

      toast.success(`Selamat datang kembali, ${res.user.name}!`);

      // Redirect langsung ke dashboard sesuai peran (bukan balik ke landing).
      // isLoading sengaja TIDAK di-reset di sini: tombol tetap nonaktif selama
      // jeda redirect 500ms agar tidak bisa submit ganda.
      setTimeout(() => {
        window.location.hash = dashboardHashForRole(res.user.role);
      }, 500);

    } catch (err: unknown) {
      // Akun belum aktif (menunggu/nonaktif/ditolak) → tampilkan panel status
      // yang jelas & persisten, bukan sekadar toast sesaat.
      // Belum verifikasi email punya jalan keluar sendiri (masukkan OTP),
      // jadi jangan disamakan dengan panel status "tunggu admin".
      if (err instanceof ApiError && err.status === 403 && err.body?.requires_email_verification) {
        setVerifyEmail(email);
        setOtp("");
        // Akun yang belum terverifikasi DAN masih ditahan admin = permohonan
        // peneliti; layar OTP perlu menyebut langkah persetujuan berikutnya.
        setAwaitingApproval(err.body.account_status === "menunggu");
        setMode("verify");
        toast.info("Email Anda belum diverifikasi. Masukkan kode yang kami kirim.");
      } else if (err instanceof ApiError && err.status === 403 && err.body?.account_status) {
        setLoginNotice({ message: err.message, status: err.body.account_status });
      } else {
        toast.error(errorMessage(err, "Gagal masuk. Silakan cek kredensial Anda."));
      }
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      toast.error("Nama, email, dan kata sandi wajib diisi.");
      return;
    }
    // Dicegat di sini supaya pemohon tak kehilangan isian panjangnya hanya
    // untuk membaca pesan validasi server. Batas 30 karakter sama dengan
    // aturan `research_purpose` di RegisterRequest.
    if (isPeneliti && regPurpose.trim().length < 30) {
      toast.error("Jelaskan tujuan penggunaan data minimal satu kalimat utuh (30 karakter).");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{ requires_admin_approval?: boolean }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          account_type: accountType,
          name: regName,
          email: regEmail,
          password: regPassword,
          institution: regInstitution,
          ...(isPeneliti ? { research_purpose: regPurpose } : {}),
        }),
      });

      setAwaitingApproval(res.requires_admin_approval === true);
      toast.success("Kode verifikasi 6 digit telah dikirim ke email Anda.");
      setVerifyEmail(regEmail);
      setEmail(regEmail);
      setPassword("");
      setOtp("");
      setMode("verify");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Pendaftaran gagal. Coba lagi."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error("Kode verifikasi terdiri dari 6 digit.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api<{ message?: string }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail, otp: otp.trim() }),
      });
      // Pesan datang dari server karena hanya server yang tahu akun ini
      // langsung aktif (warga) atau masih menunggu admin (peneliti).
      toast.success(res.message || "Email terverifikasi. Silakan masuk.");
      setMode("login");
      setEmail(verifyEmail);
      setOtp("");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Kode verifikasi salah atau kedaluwarsa."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await api("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: verifyEmail }),
      });
      // Pesan backend sengaja generik (anti-enumeration) — diteruskan apa adanya.
      toast.info("Jika email tersebut belum terverifikasi, kode baru telah dikirim.");
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Gagal mengirim ulang kode."));
    } finally {
      setIsLoading(false);
    }
  };

  const reducedMotion = useReducedMotion();
  const heading = mode === "login" ? "Masuk ke SAIBAR" : mode === "register" ? "Buat akun SAIBAR" : "Verifikasi email";

  return (
    <main className="login-page" data-mode={mode}>
      <aside className="auth-visual" aria-label="SAIBAR, informasi rob pesisir Lampung">
        <a className="auth-brand" href="#/"><img src="/logo.png" width="38" height="38" alt="" /><span>SAIBAR</span></a>
        <div className="auth-visual-copy">
          <h2>Informasi rob untuk<br />pesisir Lampung.</h2>
          <p>Pantau prediksi risiko dan bagikan kondisi di sekitar Anda. Satu tempat untuk warga, peneliti, dan pengelola.</p>
          <a href="#/map">Lihat peta tanpa masuk<Icon name="arrow_forward" /></a>
        </div>
      </aside>

      <section className="auth-form-section" aria-label="Akses akun SAIBAR">
        <div className="auth-form-toolbar">
          <button type="button" className="auth-back" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.hash = "#/")}><Icon name="arrow_back" />Kembali</button>
          <ThemeToggleControl />
        </div>
        <div className="auth-form-body">
          <div className="auth-card-wrapper">
            <a className="auth-brand auth-mobile-brand" href="#/"><img src="/logo.png" width="32" height="32" alt="" /><span>SAIBAR</span></a>
            <AnimatePresence mode="wait" initial={false}>
              <motion.form key={mode} onSubmit={mode === "login" ? handleLogin : mode === "register" ? handleRegister : handleVerifyOtp}
                initial={reducedMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.16 }} aria-labelledby="auth-title">
                <header className="auth-header-text">
                  <h1 id="auth-title">{heading}</h1>
                  {mode === "login" ? <p>Gunakan email dan kata sandi untuk melanjutkan.</p> : mode === "register" ? <p>Daftar sebagai warga atau ajukan akses untuk penelitian.</p> : <p>Kami mengirim kode 6 digit ke <strong>{verifyEmail}</strong>. Masukkan kode tersebut untuk memverifikasi email Anda.</p>}
                </header>

                {mode === "login" && <>
                  {loginNotice && <InlineNotice className="auth-status" role="alert" tone={loginNotice.status === "menunggu" ? "warning" : "error"} icon={loginNotice.status === "menunggu" ? "hourglass_top" : "block"} title={loginNotice.status === "menunggu" ? "Akun menunggu persetujuan" : loginNotice.status === "ditolak" ? "Pendaftaran ditolak" : "Akun dinonaktifkan"}>{loginNotice.message}</InlineNotice>}
                  <div className="auth-fields">
                    <div className="auth-field"><label htmlFor="login-email">Email</label><input id="login-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required /></div>
                    <PasswordField id="login-password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />
                  </div>
                  <button className="auth-submit" type="submit" disabled={isLoading} aria-busy={isLoading}>{isLoading ? "Memproses…" : "Masuk"}<Icon name={isLoading ? "hourglass_top" : "arrow_forward"} /></button>
                  <div className="auth-divider"><span>atau</span></div>
                  <a className="google-btn" href={apiUrl("/api/auth/google/redirect")}><GoogleMark />Masuk dengan Google</a>
                  <p className="auth-switch">Belum punya akun? <button type="button" className="auth-text-link" onClick={() => setMode("register")} disabled={isLoading}>Buat akun baru</button></p>
                </>}

                {mode === "register" && <>
                  <fieldset className="auth-account-types"><legend>Jenis akun</legend><div className="acct-type-grid">
                    {([{ value: "warga", title: "Warga", detail: "Lapor kejadian di sekitar Anda." }, { value: "peneliti", title: "Peneliti", detail: "Unduh dataset dan akses API." }] as const).map((option) => <label key={option.value} className="acct-type-card">
                      <input type="radio" name="account_type" value={option.value} checked={accountType === option.value} onChange={() => setAccountType(option.value)} /><strong>{option.title}</strong><span>{option.detail}</span>
                    </label>)}
                  </div></fieldset>
                  <InlineNotice className="auth-status" icon={isPeneliti ? "gavel" : "info"}>{isPeneliti ? "Permohonan peneliti ditinjau admin setelah email diverifikasi. Jelaskan tujuan penggunaan data di bawah." : "Akun warga dapat digunakan setelah verifikasi email. Untuk akun instansi BPBD, hubungi admin."}</InlineNotice>
                  <div className="auth-fields">
                    <div className="auth-field"><label htmlFor="reg-name">Nama lengkap</label><input id="reg-name" name="name" autoComplete="name" value={regName} onChange={(event) => setRegName(event.target.value)} placeholder="Nama lengkap Anda" required /></div>
                    <div className="auth-field"><label htmlFor="reg-institution">{isPeneliti ? "Instansi / universitas" : <>Desa / wilayah <span className="auth-optional">(opsional)</span></>}</label><input id="reg-institution" name="institution" autoComplete={isPeneliti ? "organization" : "address-level3"} value={regInstitution} onChange={(event) => setRegInstitution(event.target.value)} placeholder={isPeneliti ? "Nama instansi atau universitas" : "Nama desa atau wilayah"} required={isPeneliti} /></div>
                    <div className="auth-field"><label htmlFor="reg-email">Email</label><input id="reg-email" name="email" type="email" autoComplete="email" value={regEmail} onChange={(event) => setRegEmail(event.target.value)} placeholder="nama@email.com" required /></div>
                    {isPeneliti && <div className="auth-field"><label htmlFor="reg-purpose">Tujuan penggunaan data</label><textarea id="reg-purpose" name="research_purpose" rows={3} maxLength={1000} minLength={30} value={regPurpose} onChange={(event) => setRegPurpose(event.target.value)} placeholder="Contoh: Penelitian pola rob di pesisir Lampung untuk tugas akhir." aria-describedby="reg-purpose-help" required /><p className="auth-field-hint" id="reg-purpose-help">Jelaskan topik penelitian dan data yang dibutuhkan. Minimal 30 karakter ({regPurpose.trim().length}/1000).</p></div>}
                    <PasswordField id="reg-password" value={regPassword} onChange={setRegPassword} visible={showRegPassword} onToggle={() => setShowRegPassword((value) => !value)} registering />
                  </div>
                  <button className="auth-submit" type="submit" disabled={isLoading} aria-busy={isLoading}>{isLoading ? "Memproses…" : isPeneliti ? "Ajukan akun peneliti" : "Buat akun warga"}<Icon name={isLoading ? "hourglass_top" : "arrow_forward"} /></button>
                  <p className="auth-switch">Sudah punya akun? <button type="button" className="auth-text-link" onClick={() => setMode("login")} disabled={isLoading}>Masuk</button></p>
                </>}

                {mode === "verify" && <>
                  {awaitingApproval && <InlineNotice className="auth-status" role="status" tone="warning" icon="hourglass_top">Setelah verifikasi email, permohonan peneliti Anda akan menunggu persetujuan admin.</InlineNotice>}
                  <div className="auth-field"><label htmlFor="otp">Kode verifikasi</label><input id="otp" className="auth-otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus required /></div>
                  <button className="auth-submit" type="submit" disabled={isLoading} aria-busy={isLoading}>{isLoading ? "Memverifikasi…" : "Verifikasi email"}<Icon name={isLoading ? "hourglass_top" : "check"} /></button>
                  <p className="auth-switch">Belum menerima kode? <button type="button" className="auth-text-link" onClick={handleResendOtp} disabled={isLoading}>Kirim ulang</button></p>
                  <button type="button" className="auth-return auth-text-link" onClick={() => setMode("login")} disabled={isLoading}><Icon name="arrow_back" />Kembali ke halaman masuk</button>
                </>}
              </motion.form>
            </AnimatePresence>
          </div>
          <a className="auth-mobile-public" href="#/map">Lihat peta tanpa masuk<Icon name="arrow_forward" /></a>
        </div>
      </section>
    </main>
  );
}
