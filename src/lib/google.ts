import "server-only";
import { JWT } from "google-auth-library";

/**
 * Kredensial Google bersama untuk Drive dan Sheets.
 *
 * Satu service account melayani keduanya: membaca berkas materi di Drive dan
 * menambah baris jejak akses di Google Sheets. Ini juga alasan kenapa
 * scope-nya diminta sekaligus di sini, bukan terpisah di masing-masing modul.
 */

const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/calendar",
];

export function serviceAccountConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
  );
}

let cached: JWT | null = null;

function client(): JWT {
  if (cached) return cached;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !rawKey) {
    throw new Error("Service account Google belum dikonfigurasi.");
  }

  // Kunci disimpan satu baris di env, newline-nya di-escape sebagai \n.
  cached = new JWT({ email, key: rawKey.replace(/\\n/g, "\n"), scopes: SCOPES });
  return cached;
}

export async function googleAccessToken(): Promise<string> {
  const { token } = await client().getAccessToken();
  if (!token) throw new Error("Gagal memperoleh access token Google.");
  return token;
}

export async function googleHeaders(): Promise<HeadersInit> {
  return { Authorization: `Bearer ${await googleAccessToken()}` };
}
