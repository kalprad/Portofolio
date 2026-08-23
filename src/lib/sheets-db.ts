import "server-only";
import { googleHeaders, serviceAccountConfigured } from "@/lib/google";

/**
 * Mesin baca-tulis generik yang memperlakukan satu Google Sheets sebagai
 * "database" ringan untuk area Kerja (proyek, tugas, catatan, jadwal).
 *
 * Kenapa bukan berkas di repositori seperti konten situs lain (lihat
 * `content-write.ts`): data di area Kerja berubah puluhan kali sehari — centang
 * tugas, geser status, tambah catatan. Kalau tiap perubahan jadi commit git,
 * riwayatnya jadi sampah dan tiap perubahan harus nunggu Vercel deploy ulang
 * dulu (±1 menit) sebelum kelihatan. Sheets menerima tulisan berkali-kali
 * secara instan tanpa proses build.
 *
 * Penghapusan selalu "lunak" (kolom `dihapus` diisi TRUE), bukan menghapus
 * baris sungguhan — supaya nomor baris tidak pernah bergeser di antara baca
 * dan tulis, dan histori lama tetap bisa ditelusuri langsung di lembarnya.
 */

const SHEETS_API = "https://sheets.googleapis.com/v4/spreadsheets";

function spreadsheetId(): string | null {
  return process.env.GOOGLE_SHEETS_KERJA_ID ?? null;
}

export function workspaceSheetsConfigured(): boolean {
  return Boolean(serviceAccountConfigured() && spreadsheetId());
}

/** Tautan agar panel admin bisa membuka lembarnya langsung. */
export function workspaceSheetUrl(): string | null {
  const id = spreadsheetId();
  return id ? `https://docs.google.com/spreadsheets/d/${id}` : null;
}

function colLetter(index0: number): string {
  let n = index0 + 1;
  let s = "";
  while (n > 0) {
    const sisa = (n - 1) % 26;
    s = String.fromCharCode(65 + sisa) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function rentangBaca(tab: string, kolom: string[]): string {
  return `${tab}!A2:${colLetter(kolom.length - 1)}`;
}

function rentangBaris(tab: string, kolom: string[], baris: number): string {
  return `${tab}!A${baris}:${colLetter(kolom.length - 1)}${baris}`;
}

async function panggil(path: string, init?: RequestInit): Promise<Response> {
  const id = spreadsheetId();
  if (!id) throw new Error("GOOGLE_SHEETS_KERJA_ID belum disetel.");

  const res = await fetch(`${SHEETS_API}/${id}${path}`, {
    ...init,
    headers: {
      ...(await googleHeaders()),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Google Sheets menolak permintaan (${res.status}): ${await res.text()}`);
  }
  return res;
}

export interface BarisMentah {
  /** Nomor baris sungguhan di lembar (1-based, baris 1 = judul kolom). */
  baris: number;
  nilai: string[];
}

/** Baca semua baris data (tanpa baris judul) dari satu tab. */
export async function bacaTabel(tab: string, kolom: string[]): Promise<BarisMentah[]> {
  if (!workspaceSheetsConfigured()) return [];

  const res = await panggil(`/values/${encodeURIComponent(rentangBaca(tab, kolom))}`);
  const data = (await res.json()) as { values?: string[][] };
  const rows = data.values ?? [];

  return rows.map((nilai, i) => ({ baris: i + 2, nilai }));
}

/** Tambah satu baris baru di akhir tab. */
export async function tambahBaris(tab: string, kolom: string[], nilai: string[]): Promise<void> {
  const rentang = `${tab}!A:${colLetter(kolom.length - 1)}`;
  await panggil(
    `/values/${encodeURIComponent(rentang)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [nilai] }) },
  );
}

/** Timpa satu baris yang sudah ada, berdasar nomor barisnya. */
export async function perbaruiBaris(
  tab: string,
  kolom: string[],
  baris: number,
  nilai: string[],
): Promise<void> {
  await panggil(
    `/values/${encodeURIComponent(rentangBaris(tab, kolom, baris))}?valueInputOption=RAW`,
    { method: "PUT", body: JSON.stringify({ values: [nilai] }) },
  );
}

/** Ambil nilai kolom sebagai objek `{ namaKolom: nilai }`, aman dari kolom kosong di ujung baris. */
export function petakanBaris(kolom: string[], nilai: string[]): Record<string, string> {
  const hasil: Record<string, string> = {};
  kolom.forEach((k, i) => {
    hasil[k] = nilai[i] ?? "";
  });
  return hasil;
}

export function teksKe(nilai: string | undefined, kosong: string | null = null): string | null {
  if (!nilai || nilai.trim() === "") return kosong;
  return nilai;
}

export function angkaKe(nilai: string | undefined, kosong = 0): number {
  const n = Number(nilai);
  return Number.isFinite(n) ? n : kosong;
}

export function boolKe(nilai: string | undefined): boolean {
  return nilai === "TRUE" || nilai === "true" || nilai === "1";
}
