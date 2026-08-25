import "server-only";
import { googleHeaders, serviceAccountConfigured } from "@/lib/google";

/**
 * Akses Google Drive dari sisi server.
 *
 * Ada dua mode, dipilih otomatis berdasar variabel lingkungan yang terisi.
 *
 * MODE PROXY (dianjurkan) — aktif kalau service account Google sudah disetel.
 *   Berkas di Drive boleh tetap privat; cukup dibagikan ke alamat service
 *   account sebagai Viewer. Server yang mengambil isinya lalu meneruskan
 *   byte-nya ke pengunduh. URL Drive tidak pernah sampai ke browser, jadi tidak
 *   ada yang bisa disebarkan.
 *
 * MODE ALIH (cadangan) — kalau service account belum disiapkan. Server
 *   memverifikasi sesi dan mencatat akses, lalu mengalihkan ke tautan Drive.
 *   Setiap unduhan tetap tercatat, tapi pengunjung yang membuka panel jaringan
 *   peramban bisa melihat URL aslinya. Pakai ini hanya sebagai tahap sementara.
 *
 * Batas praktis mode proxy di Vercel: berkas besar (ratusan MB) memakan durasi
 * fungsi dan kuota bandwidth. Untuk berkas semacam itu, simpan sebagai folder
 * Drive dan pakai kolom `drive_folder_id` alih-alih `drive_file_id`.
 *
 * Fungsi-fungsi di atas semuanya baca-saja lewat service account, dipakai
 * Arsip (publik). Lampiran Catatan Ultraproduktif (privat, satu pengguna)
 * beda pendekatan dua kali lipat: `mulaiSesiUnggahDrive` di bawah MENULIS ke
 * Drive, TAPI pakai token OAuth pemilik situs sendiri (bukan service
 * account — service account tidak punya kuota penyimpanan di Drive pribadi
 * manapun, cuma bisa nulis ke Shared Drive yang butuh Google Workspace
 * berbayar). Isinya diteruskan lewat relai `/api/ultraproduktif/catatan/unggah`
 * milik server kita sendiri (bukan di-PUT langsung dari peramban ke Drive —
 * Drive tidak mengizinkan CORS buat itu). Pratinjau/unduhnya baru balik pakai
 * iframe/tautan Drive resmi langsung (bukan proxy) karena tidak ada
 * pengunjung lain yang perlu disembunyikan URL-nya.
 */

export type DriveMode = "proxy" | "alih";

export function driveMode(): DriveMode {
  return serviceAccountConfigured() ? "proxy" : "alih";
}

export interface DriveFileMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
}

/** Metadata berkas. Dipakai panel admin untuk mengisi ukuran & tipe otomatis. */
export async function fetchDriveMetadata(fileId: string): Promise<DriveFileMeta | null> {
  if (driveMode() !== "proxy") return null;

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("fields", "id,name,mimeType,size");
  url.searchParams.set("supportsAllDrives", "true");

  const res = await fetch(url, { headers: await googleHeaders() });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
  };
  return {
    id: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: data.size ? Number(data.size) : null,
  };
}

/**
 * Ambil isi berkas sebagai respons yang bisa distream langsung ke pengunduh.
 * Hanya tersedia di mode proxy.
 */
export async function fetchDriveContent(fileId: string): Promise<Response> {
  const url = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("supportsAllDrives", "true");

  return fetch(url, { headers: await googleHeaders() });
}

/** Tautan unduh publik — hanya dipakai di mode alih. */
export function publicDriveUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

/** Tautan folder Drive, untuk butir arsip yang berupa folder. */
export function driveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

/** ID folder Drive tujuan unggah lampiran Catatan Ultraproduktif. */
export function catatanFolderId(): string | null {
  return process.env.GOOGLE_DRIVE_CATATAN_FOLDER_ID || null;
}

/**
 * Mulai sesi RESUMABLE UPLOAD Drive buat lampiran Catatan Ultraproduktif —
 * kirim metadata tujuan saja (nama berkas, folder), TANPA isi berkasnya.
 * Baliknya URL sesi yang lalu di-PUT lewat relai `/api/ultraproduktif/catatan/unggah`
 * (bukan langsung dari peramban — Drive tidak mengizinkan CORS buat itu).
 *
 * Ini kenapa ukuran berkas yang bisa diunggah TIDAK kebentur batas request
 * fungsi serverless (Vercel keras membatasi body request di sekitar 4,5 MB) —
 * byte-nya diteruskan sebagai stream, tidak pernah ditampung penuh di memori.
 *
 * PAKAI TOKEN OAuth PEMILIK SITUS SENDIRI (`accessToken`, dari sesi login-nya
 * — lihat `session.driveAccessToken` di `auth.ts`), BUKAN token service
 * account seperti fungsi lain di modul ini. Alasannya: service account tidak
 * punya kuota penyimpanan Drive di folder pribadi manapun (`Service Accounts
 * do not have storage quota` — cuma bisa nulis ke Shared Drive, fitur
 * Workspace berbayar yang tidak tersedia buat akun Gmail biasa). Upload
 * mewakili pemilik situs sendiri memakai kuota Drive miliknya.
 */
export async function mulaiSesiUnggahDrive(input: {
  accessToken: string;
  folderId: string;
  fileName: string;
  mimeType: string;
}): Promise<string> {
  const url = new URL("https://www.googleapis.com/upload/drive/v3/files");
  url.searchParams.set("uploadType", "resumable");
  url.searchParams.set("fields", "id,name,mimeType,size");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": input.mimeType,
    },
    body: JSON.stringify({ name: input.fileName, parents: [input.folderId] }),
  });

  if (!res.ok) {
    throw new Error(`Google Drive menolak permintaan sesi unggah (${res.status}): ${await res.text()}`);
  }

  const lokasi = res.headers.get("Location");
  if (!lokasi) throw new Error("Google Drive tidak mengembalikan URL sesi unggah.");
  return lokasi;
}

/**
 * Menerima ID mentah maupun URL Drive lengkap, mengembalikan ID-nya saja.
 * Supaya di panel admin bisa tempel-tempel URL apa adanya.
 */
export function extractDriveId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return m[1];
  }
  // Bukan URL — anggap sudah berupa ID.
  return /^[a-zA-Z0-9_-]{10,}$/.test(trimmed) ? trimmed : "";
}
