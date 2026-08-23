import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, LogOut, ShieldCheck } from "lucide-react";
import { Container, Button, ButtonLink, Badge } from "@/components/ui/primitives";
import { masukDenganGoogle, keluar } from "@/app/actions/auth";
import { sesiAman, ugmDomains } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk untuk membuka arsip kuliah atau panel admin.",
  robots: { index: false, follow: false },
};

const PESAN_GALAT: Record<string, string> = {
  "perlu-masuk": "Halaman itu perlu login terlebih dahulu.",
  "bukan-admin": "Akun ini tidak punya akses ke panel admin.",
  AccessDenied: "Login ditolak. Pastikan alamat email akun Google sudah terverifikasi.",
  Configuration:
    "Autentikasi belum dikonfigurasi. Periksa AUTH_SECRET, AUTH_GOOGLE_ID, dan AUTH_GOOGLE_SECRET.",
  OAuthAccountNotLinked: "Alamat email ini sudah terpakai lewat metode masuk lain.",
};

function IkonGoogle() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default async function Masuk({
  searchParams,
}: {
  searchParams: Promise<{ tujuan?: string; galat?: string; error?: string }>;
}) {
  const { tujuan, galat, error } = await searchParams;
  const session = await sesiAman();

  const kodeGalat = galat ?? error;
  const pesan = kodeGalat ? (PESAN_GALAT[kodeGalat] ?? "Login gagal. Coba lagi.") : null;

  // Tujuan hanya diterima kalau berupa lintasan internal — mencegah situs ini
  // dipakai sebagai batu loncatan ke alamat luar.
  const tujuanAman = tujuan?.startsWith("/") && !tujuan.startsWith("//") ? tujuan : "/";

  return (
    <Container size="narrow">
      <div className="flex min-h-[70dvh] flex-col justify-center py-16">
        <p className="eyebrow">Masuk</p>
        <h1 className="display-lg mt-3">Satu tombol, dua pintu</h1>

        <p className="mt-5 text-muted-foreground">
          Masuk dengan Google. Akun UGM membuka unduhan arsip kuliah; akun
          pemilik situs membuka panel admin.
        </p>

        {pesan ? (
          <p
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded border border-destructive/40 bg-muted px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {pesan}
          </p>
        ) : null}

        {session?.user ? (
          <div className="mt-8 rounded border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone={session.user.isAdmin ? "accent" : session.user.isUgm ? "success" : "neutral"}>
                {session.user.isAdmin ? "Admin" : session.user.isUgm ? "Mahasiswa UGM" : "Tamu"}
              </Badge>
              <span className="text-sm text-muted-foreground">{session.user.email}</span>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {session.user.isAdmin ? (
                <ButtonLink href="/admin">Buka panel admin</ButtonLink>
              ) : null}
              {session.user.isUgm ? (
                <ButtonLink href="/arsip" variant={session.user.isAdmin ? "outline" : "primary"}>
                  Buka arsip kuliah
                </ButtonLink>
              ) : null}
              <form action={keluar}>
                <Button type="submit" variant="ghost">
                  <LogOut className="size-4" aria-hidden />
                  Keluar
                </Button>
              </form>
            </div>

            {!session.user.isUgm && !session.user.isAdmin ? (
              <p className="mt-5 text-sm text-muted-foreground">
                Akun ini bukan akun UGM dan bukan pemilik situs. Keluar lalu masuk
                lagi dengan alamat berdomain{" "}
                {ugmDomains().map((d) => `@${d}`).join(" atau ")} untuk membuka arsip.
              </p>
            ) : null}
          </div>
        ) : (
          <form action={masukDenganGoogle} className="mt-8">
            <input type="hidden" name="tujuan" value={tujuanAman} />
            <Button type="submit" size="lg" variant="outline">
              <IkonGoogle />
              Masuk dengan Google
            </Button>
          </form>
        )}

        <p className="mt-10 flex items-start gap-2 text-xs text-subtle">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            Situs ini hanya membaca nama dan alamat email dari akun Google Anda.
            Tidak ada akses ke Drive, surel, maupun kontak.{" "}
            <Link href="/" className="link-underline">
              Kembali ke beranda
            </Link>
            .
          </span>
        </p>
      </div>
    </Container>
  );
}
