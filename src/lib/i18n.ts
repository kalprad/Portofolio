/**
 * Kerangka dua bahasa.
 *
 * Fase 1 hanya menjalankan Bahasa Indonesia. Semua teks yang tampil ke
 * pengunjung sudah diambil lewat `pick()`, jadi menyalakan Bahasa Inggris
 * nanti tinggal: (1) isi kolom `_en` di database, (2) ubah
 * `ENABLED_LOCALES` di bawah, (3) tampilkan `<LocaleSwitch />` di header.
 * Tidak ada perubahan skema maupun pembongkaran komponen.
 */

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "id";

/** Bahasa yang aktif untuk pengunjung. Tambahkan "en" saat siap. */
export const ENABLED_LOCALES: Locale[] = ["id"];

export const LOCALE_LABEL: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

export const LOCALE_SHORT: Record<Locale, string> = { id: "ID", en: "EN" };

export function isMultilingual(): boolean {
  return ENABLED_LOCALES.length > 1;
}

export function normalizeLocale(value?: string | null): Locale {
  const v = (value ?? "").toLowerCase();
  return (ENABLED_LOCALES as string[]).includes(v) ? (v as Locale) : DEFAULT_LOCALE;
}

/**
 * Ambil nilai berbahasa dari sebuah baris database.
 *
 * `pick(post, "title", "en")` mencari `post.title_en`; kalau kosong ia jatuh
 * kembali ke `post.title_id`. Jadi halaman tidak pernah blank hanya karena
 * terjemahan belum diisi.
 */
export function pick(
  row: object | null | undefined,
  field: string,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!row) return "";
  // Pemanggil mengirim baris database bertipe spesifik (Project, Post, dst.),
  // sedangkan kolomnya dipilih lewat nama saat runtime.
  const r = row as Record<string, unknown>;
  const wanted = r[`${field}_${locale}`];
  if (typeof wanted === "string" && wanted.trim() !== "") return wanted;
  const fallback = r[`${field}_${DEFAULT_LOCALE}`];
  return typeof fallback === "string" ? fallback : "";
}

/** Versi `pick` yang membedakan "kosong" dari "tidak ada". */
export function pickOrNull(
  row: object | null | undefined,
  field: string,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  const value = pick(row, field, locale);
  return value === "" ? null : value;
}

/** Menandai apakah sebuah baris sudah punya terjemahan Inggris. */
export function hasTranslation(
  row: object | null | undefined,
  fields: string[],
): boolean {
  if (!row) return false;
  const r = row as Record<string, unknown>;
  return fields.every((f) => {
    const v = r[`${f}_en`];
    return typeof v === "string" && v.trim() !== "";
  });
}
