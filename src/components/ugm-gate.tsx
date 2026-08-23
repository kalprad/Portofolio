import { GraduationCap, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { masukDenganGoogle, keluar } from "@/app/actions/auth";
import { ugmDomains } from "@/lib/auth";

/** Ikon Google resmi — SVG, bukan emoji, supaya tajam di semua ukuran. */
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

/**
 * Gerbang verifikasi mahasiswa UGM.
 *
 * Tiga keadaan: belum masuk, sudah masuk tapi bukan alamat UGM, dan lolos.
 * Yang ketiga tidak merender apa pun — pemanggilnya yang menampilkan isi.
 */
export function UgmGate({
  sudahMasuk,
  emailPengguna,
  tujuan,
}: {
  sudahMasuk: boolean;
  emailPengguna?: string | null;
  tujuan: string;
}) {
  const domain = ugmDomains();

  if (!sudahMasuk) {
    return (
      <div className="rounded border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded bg-accent-soft text-accent">
            <GraduationCap className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-semibold">
              Masuk dengan akun UGM untuk mengunduh
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Materi ini terbuka untuk sesama mahasiswa UGM. Masuk dengan akun
              Google berdomain{" "}
              {domain.map((d, i) => (
                <span key={d}>
                  {i > 0 ? " atau " : ""}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">@{d}</code>
                </span>
              ))}{" "}
              — termasuk subdomainnya seperti{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">@mail.ugm.ac.id</code>.
            </p>

            <form action={masukDenganGoogle} className="mt-6">
              <input type="hidden" name="tujuan" value={tujuan} />
              <Button type="submit" variant="outline">
                <IkonGoogle />
                Masuk dengan Google
              </Button>
            </form>

            <p className="mt-5 flex items-start gap-2 text-xs text-subtle">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span>
                Yang disimpan hanya nama, alamat email, dan catatan berkas yang
                diunduh. Tidak ada akses ke Drive atau surel Anda.
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-surface p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold">Akun ini bukan akun UGM</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Anda masuk sebagai{" "}
        <span className="font-medium text-foreground">{emailPengguna ?? "pengguna"}</span>.
        Unduhan arsip hanya terbuka untuk alamat berdomain{" "}
        {domain.map((d) => `@${d}`).join(" atau ")}. Silakan keluar lalu masuk lagi
        dengan akun UGM Anda.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <form action={keluar}>
          <Button type="submit" variant="outline">
            <LogOut className="size-4" aria-hidden />
            Keluar
          </Button>
        </form>
      </div>
    </div>
  );
}
