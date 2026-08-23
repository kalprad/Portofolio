import "server-only";
import { googleHeaders, serviceAccountConfigured } from "@/lib/google";

/**
 * Jejak akses arsip, dicatat ke Google Sheets.
 *
 * Kenapa bukan di repositori: setiap unduhan adalah satu tulisan baru. Kalau
 * disimpan sebagai berkas di git, satu mahasiswa mengunduh berarti satu commit
 * — ratusan mahasiswa berarti ratusan commit sampah, plus tabrakan tulis kalau
 * dua orang mengunduh bersamaan. Sheets menangani penambahan baris serentak
 * dengan benar, gratis, dan datanya tetap milik sendiri.
 *
 * Kegagalan pencatatan tidak pernah menghalangi unduhan: yang dicari adalah
 * gambaran, bukan pembukuan akuntansi.
 */

const KOLOM = [
  "Waktu",
  "Email",
  "Nama",
  "Peran",
  "Mata kuliah",
  "Berkas",
  "Hasil",
  "IP (hash)",
] as const;

export interface BarisJejak {
  waktu: string;
  email: string;
  nama: string;
  peran: string;
  mataKuliah: string;
  berkas: string;
  hasil: "ok" | "ditolak" | "gagal";
  ipHash: string;
}

function spreadsheetId(): string | null {
  return process.env.GOOGLE_SHEETS_LOG_ID ?? null;
}

function tab(): string {
  return process.env.GOOGLE_SHEETS_LOG_TAB ?? "Log";
}

export function sheetsConfigured(): boolean {
  return Boolean(serviceAccountConfigured() && spreadsheetId());
}

/** Tautan agar pemilik situs bisa membuka lembarnya langsung dari panel admin. */
export function sheetUrl(): string | null {
  const id = spreadsheetId();
  return id ? `https://docs.google.com/spreadsheets/d/${id}` : null;
}

function apiUrl(rentang: string, aksi = ""): string {
  const id = spreadsheetId();
  return (
    `https://sheets.googleapis.com/v4/spreadsheets/${id}` +
    `/values/${encodeURIComponent(rentang)}${aksi}`
  );
}

/** Tambah satu baris di akhir lembar. Aman dipanggil bersamaan. */
export async function catatJejak(baris: BarisJejak): Promise<void> {
  if (!sheetsConfigured()) return;

  try {
    const res = await fetch(
      `${apiUrl(`${tab()}!A:H`, ":append")}?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: { ...(await googleHeaders()), "Content-Type": "application/json" },
        body: JSON.stringify({
          values: [
            [
              baris.waktu,
              baris.email,
              baris.nama,
              baris.peran,
              baris.mataKuliah,
              baris.berkas,
              baris.hasil,
              baris.ipHash,
            ],
          ],
        }),
      },
    );

    if (!res.ok) {
      console.error("[sheets] gagal mencatat jejak:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[sheets] gagal mencatat jejak:", err);
  }
}

/** Baca kembali jejak untuk ditampilkan di panel admin, terbaru lebih dulu. */
export async function bacaJejak(batas = 200): Promise<BarisJejak[]> {
  if (!sheetsConfigured()) return [];

  try {
    const res = await fetch(apiUrl(`${tab()}!A2:H`), {
      headers: await googleHeaders(),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[sheets] gagal membaca jejak:", res.status);
      return [];
    }

    const data = (await res.json()) as { values?: string[][] };
    const rows = data.values ?? [];

    return rows
      .map((r): BarisJejak => ({
        waktu: r[0] ?? "",
        email: r[1] ?? "",
        nama: r[2] ?? "",
        peran: r[3] ?? "",
        mataKuliah: r[4] ?? "",
        berkas: r[5] ?? "",
        hasil: (r[6] as BarisJejak["hasil"]) ?? "ok",
        ipHash: r[7] ?? "",
      }))
      .reverse()
      .slice(0, batas);
  } catch (err) {
    console.error("[sheets] gagal membaca jejak:", err);
    return [];
  }
}

/** Baris judul yang perlu ada di baris pertama lembar. */
export const JUDUL_KOLOM = KOLOM;
