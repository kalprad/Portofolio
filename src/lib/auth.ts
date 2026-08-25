import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "@/lib/types";

/**
 * Autentikasi Google.
 *
 * Dua kelompok pengguna berbagi satu tombol login:
 *
 *   admin — alamat yang terdaftar di ADMIN_EMAILS. Akses penuh ke panel admin.
 *   ugm   — alamat pada domain UGM. Akses ke arsip kuliah, tidak ke panel.
 *   tamu  — sudah login Google tapi bukan keduanya. Ditolak di gerbang arsip.
 *
 * Catatan: yang login di gerbang UGM adalah PENGUNJUNG, bukan pemilik situs.
 * Jadi akun UGM pemilik yang hilang setelah lulus tidak memengaruhi apa pun —
 * pemilik masuk lewat alamat pribadi yang terdaftar di ADMIN_EMAILS.
 */

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
      isAdmin: boolean;
      isUgm: boolean;
    } & DefaultSession["user"];
    /**
     * Access token Drive milik PEMILIK SITUS sendiri (bukan service account) —
     * dipakai lampiran Catatan Ultraproduktif, karena service account tidak
     * punya kuota penyimpanan di Drive pribadi (lihat komentar di provider
     * Google di bawah). `null` kalau sesi ini belum pernah menyetujui izin
     * Drive (mis. login dari sebelum fitur ini ada) — logout+masuk ulang
     * buat memicu layar izin baru.
     */
    driveAccessToken: string | null;
  }
}

/** Bentuk field tambahan yang dititipkan di JWT — lihat callback `jwt` di bawah. */
interface DriveTokenClaims {
  driveAccessToken?: string;
  driveRefreshToken?: string;
  /** Unix seconds. */
  driveExpiresAt?: number;
}

/**
 * Access token Google kadaluwarsa dalam ~1 jam — sesi situs ini bertahan 30
 * hari, jadi HARUS diperpanjang berkali-kali pakai refresh token.
 *
 * Catatan: kalau layar izin OAuth di Google Cloud Console masih berstatus
 * "Testing" (belum di-publish), Google membatalkan refresh token itu sendiri
 * tiap 7 hari terlepas dari dipakai atau tidak — kalau tiba-tiba unggahan
 * gagal lagi dengan galat izin setelah sempat jalan, itu penyebabnya, bukan
 * bug di sini. Publish app-nya (tidak perlu proses verifikasi lengkap untuk
 * pemakaian sendiri) buat menghilangkan batas itu.
 */
async function segarkanTokenDrive(token: DriveTokenClaims): Promise<DriveTokenClaims> {
  if (!token.driveRefreshToken) return token;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AUTH_GOOGLE_ID ?? "",
        client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.driveRefreshToken,
      }),
    });
    const data = (await res.json()) as { access_token?: string; expires_in?: number; refresh_token?: string; error?: string };
    if (!res.ok || !data.access_token) throw new Error(data.error ?? `status ${res.status}`);

    return {
      ...token,
      driveAccessToken: data.access_token,
      driveExpiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      driveRefreshToken: data.refresh_token ?? token.driveRefreshToken,
    };
  } catch (err) {
    console.error("[auth] gagal menyegarkan token Drive:", err);
    // Biarkan token lama (kadaluwarsa) apa adanya — lebih baik unggahan gagal
    // dengan galat yang jelas daripada sesi login utuh ikut rusak gara-gara
    // ini.
    return token;
  }
}

function listFromEnv(value: string | undefined, fallback: string[] = []): string[] {
  if (!value) return fallback;
  return value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function adminEmails(): string[] {
  return listFromEnv(process.env.ADMIN_EMAILS);
}

/** Domain yang dianggap milik UGM. Subdomain ikut diterima. */
export function ugmDomains(): string[] {
  return listFromEnv(process.env.UGM_EMAIL_DOMAINS, ["ugm.ac.id"]);
}

export function isUgmEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return false;
  // "ugm.ac.id" cocok persis, dan juga menerima mail./student./alumni. dst.
  return ugmDomains().some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export function resolveRole(email: string | null | undefined): Role {
  if (isAdminEmail(email)) return "admin";
  if (isUgmEmail(email)) return "ugm";
  return "tamu";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      // `prompt: select_account` supaya pengguna dengan beberapa akun Google
      // (pribadi + UGM) bisa memilih, bukan langsung dipakaikan yang terakhir.
      //
      // Ini scope BAWAAN — cuma nama & email, sesuai janji di halaman /masuk
      // ("tidak ada akses ke Drive"). Scope Drive (`drive.file`, buat lampiran
      // Catatan Ultraproduktif) TIDAK dipasang statis di sini — kalau dipasang
      // di sini, SEMUA pengunjung (termasuk mahasiswa UGM yang cuma mau buka
      // arsip) bakal disodori layar izin Drive yang tidak relevan buat
      // mereka, dan janji "tidak ada akses ke Drive" di /masuk jadi bohong.
      // Sebagai gantinya, scope tambahan itu diminta per-panggilan lewat
      // parameter ketiga `signIn()` di `masukDenganGoogle` — HANYA kalau
      // tujuan login-nya area admin/Ultraproduktif.
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/masuk",
    error: "/masuk",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    async signIn({ profile }) {
      // Tolak alamat yang belum diverifikasi Google: tanpa ini, domain UGM
      // bisa diklaim lewat akun yang emailnya belum terbukti.
      if (profile && profile.email_verified === false) return false;
      return true;
    },
    async jwt({ token, account }) {
      // Peran ikut dititipkan di token supaya sesi tidak perlu menyentuh
      // database di setiap permintaan.
      (token as Record<string, unknown>).role = resolveRole(token.email);

      let klaim = token as DriveTokenClaims;
      if (account?.access_token) {
        // Baru saja masuk — Google cuma mengirim token OAuth di langkah ini.
        klaim = {
          ...klaim,
          driveAccessToken: account.access_token,
          driveRefreshToken: account.refresh_token ?? klaim.driveRefreshToken,
          driveExpiresAt: account.expires_at,
        };
      } else if (klaim.driveExpiresAt && Date.now() >= klaim.driveExpiresAt * 1000 - 60_000) {
        klaim = { ...klaim, ...(await segarkanTokenDrive(klaim)) };
      }

      return { ...token, ...klaim };
    },
    async session({ session, token }) {
      const role = ((token as Record<string, unknown>).role ?? "tamu") as Role;
      session.user.role = role;
      session.user.isAdmin = role === "admin";
      session.user.isUgm = role === "ugm" || role === "admin";
      session.driveAccessToken = (token as DriveTokenClaims).driveAccessToken ?? null;
      return session;
    },
  },
  trustHost: true,
});

/** True kalau kredensial Google dan AUTH_SECRET sudah terisi. */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_GOOGLE_ID &&
      process.env.AUTH_GOOGLE_SECRET,
  );
}

/**
 * `auth()` yang tidak pernah melempar galat.
 *
 * Sebelum .env.local diisi, `auth()` gagal karena AUTH_SECRET kosong — dan
 * karena hampir setiap halaman memanggilnya, satu galat itu akan mematikan
 * seluruh situs pada percobaan pertama. Di sini kegagalannya diperlakukan
 * sebagai "belum ada yang masuk", sehingga halaman publik tetap bisa dilihat
 * sambil setup diselesaikan.
 */
export async function sesiAman() {
  if (!isAuthConfigured()) return null;
  try {
    return await auth();
  } catch (err) {
    console.error("[auth] gagal membaca sesi:", err);
    return null;
  }
}

/** Sesi admin atau `null`. Dipakai sebagai penjaga di server action. */
export async function requireAdmin() {
  const session = await sesiAman();
  if (!session?.user?.isAdmin) return null;
  return session;
}
