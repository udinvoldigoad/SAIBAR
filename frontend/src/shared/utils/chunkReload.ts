/**
 * Pemulihan otomatis saat potongan kode (chunk) halaman gagal diunduh —
 * "Failed to fetch dynamically imported module". Terjadi bila tab masih
 * memakai bundle lama setelah deploy, atau jaringan sempat gagal (mis. saat
 * DNS/CDN dipindah). Browser mengingat import yang gagal sampai halaman
 * dimuat ulang, jadi satu kali reload biasanya cukup.
 *
 * Pengaman: paling banyak sekali reload per 30 detik (disimpan di
 * sessionStorage), supaya kegagalan yang menetap (server benar-benar tak bisa
 * dijangkau) tidak memicu reload tanpa henti — saat itu ErrorBoundary tetap
 * menampilkan halaman error dengan tombol "Muat ulang".
 */

const STORAGE_KEY = "saibar-chunk-reload-at";
const COOLDOWN_MS = 30_000;

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return CHUNK_ERROR_PATTERN.test(message);
}

/** Muat ulang halaman bila belum dilakukan dalam 30 detik terakhir. Mengembalikan true bila reload dijalankan. */
export function reloadOnceForChunkError(): boolean {
  let last = 0;
  try {
    last = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0);
  } catch {
    /* storage diblokir — tetap coba reload sekali */
  }
  if (Date.now() - last < COOLDOWN_MS) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* abaikan */
  }
  window.location.reload();
  return true;
}

/** Pasang penangan event `vite:preloadError` (dipanggil sekali dari main.tsx). */
export function installChunkReloadHandler(): void {
  window.addEventListener("vite:preloadError", (event) => {
    if (reloadOnceForChunkError()) event.preventDefault();
  });
}
