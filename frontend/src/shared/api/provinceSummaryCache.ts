/**
 * Cache layer untuk /dashboard/province/summary.
 *
 * Modul ini menyimpan respons di memori selama 5 menit. Halaman mana pun
 * yang membutuhkan data ringkasan provinsi cukup memanggil
 * `fetchProvinceSummary()` — jika cache masih segar, Promise langsung
 * resolve tanpa network request. Hal ini mencegah landing page dan
 * halaman Pantauan Provinsi menarik data dua kali saat pengguna
 * berpindah di antara keduanya.
 */
import { api } from "./client";

export interface ProvinceSummaryData {
  monitored_regencies: number;
  high_risk_villages: number;
  risk_population: number;
  validated_reports_this_month: number;
  latest_prediction_date?: string | null;
  regencies?: {
    regency: string;
    low_count: number;
    medium_count: number;
    high_count: number;
    critical_count: number;
    risk_population: number;
    max_probability: number;
    trend: string;
    previous_high_risk_count?: number;
    high_risk_delta?: number;
  }[];
  trend_30_days?: {
    prediction_date: string;
    avg_probability: number | string;
    max_probability: number | string;
    critical_count?: number | string;
    high_count?: number | string;
    high_risk_count?: number | string;
  }[];
  filters?: { month?: string | null; regency?: string | null };
  available_regencies?: string[];
  top_impacted?: any[];
  population_audit?: any;
}

interface CacheEntry {
  data: ProvinceSummaryData;
  timestamp: number;
  /** Query string yang dipakai saat fetch (kosong = tanpa filter). */
  query: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit

let cache: CacheEntry | null = null;

/**
 * Ambil ringkasan provinsi. Tanpa parameter = data global (tanpa filter).
 * Jika `query` berbeda dari cache terakhir, cache dianggap basi.
 */
export async function fetchProvinceSummary(query = ""): Promise<ProvinceSummaryData> {
  if (cache && cache.query === query && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const suffix = query ? `?${query}` : "";
  const res = await api<{ data: ProvinceSummaryData }>(`/dashboard/province/summary${suffix}`);

  cache = { data: res.data, timestamp: Date.now(), query };
  return res.data;
}

/** Paksa cache kedaluwarsa (misalnya setelah filter berubah di Province page). */
export function invalidateProvinceSummaryCache(): void {
  cache = null;
}

/** Kembalikan data cache yang ada (bisa null). Tidak melakukan fetch. */
export function getProvinceSummaryCached(): ProvinceSummaryData | null {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) return cache.data;
  return null;
}
