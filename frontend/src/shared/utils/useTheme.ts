/**
 * Tema terang/gelap bersama untuk landing (PortalPage) dan AppShell.
 *
 * Pergantian tema dianimasikan dengan View Transitions API: tema baru
 * "terbuka" sebagai lingkaran yang membesar dari posisi tombol toggle,
 * sehingga batas tema lama/baru tampak sebagai lengkungan yang menyapu layar.
 * Browser tanpa dukungan (Firefox lama) atau pengguna dengan
 * prefers-reduced-motion langsung berganti tanpa animasi.
 */
import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

const STORAGE_KEY = "saibar-theme";
const REVEAL_DURATION_MS = 700;

function readStoredTheme(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "dark") return true;
  } catch {
    /* storage diblokir — pakai atribut yang sudah ada */
  }
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function applyTheme(dark: boolean): void {
  if (dark) document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    /* abaikan: tema tetap berlaku untuk sesi ini */
  }
}

export interface ThemeOrigin {
  x: number;
  y: number;
}

export function useTheme() {
  const [isDark, setIsDark] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleTheme = useCallback(
    (origin?: ThemeOrigin) => {
      const next = !isDark;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (!origin || reduceMotion || typeof document.startViewTransition !== "function") {
        setIsDark(next);
        return;
      }

      const transition = document.startViewTransition(() => {
        flushSync(() => setIsDark(next));
        applyTheme(next);
      });

      // Jari-jari sampai sudut layar terjauh dari titik asal.
      const radius = Math.hypot(
        Math.max(origin.x, window.innerWidth - origin.x),
        Math.max(origin.y, window.innerHeight - origin.y),
      );

      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${origin.x}px ${origin.y}px)`,
                `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
              ],
            },
            {
              duration: REVEAL_DURATION_MS,
              easing: "cubic-bezier(0.65, 0, 0.35, 1)",
              pseudoElement: "::view-transition-new(root)",
            },
          );
        })
        .catch(() => {
          /* transisi dibatalkan — tema tetap sudah berganti */
        });
    },
    [isDark],
  );

  return { isDark, toggleTheme };
}
