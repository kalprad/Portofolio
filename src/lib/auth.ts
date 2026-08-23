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
    async jwt({ token }) {
      // Peran ikut dititipkan di token supaya sesi tidak perlu menyentuh
      // database di setiap permintaan.
      (token as Record<string, unknown>).role = resolveRole(token.email);
      return token;
    },
    async session({ session, token }) {
      const role = ((token as Record<string, unknown>).role ?? "tamu") as Role;
      session.user.role = role;
      session.user.isAdmin = role === "admin";
      session.user.isUgm = role === "ugm" || role === "admin";
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
