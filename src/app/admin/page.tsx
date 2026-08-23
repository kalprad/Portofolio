import Link from "next/link";
import { ArrowUpRight, Plus, GitBranch, HardDrive, ClipboardList } from "lucide-react";
import { ButtonLink, Badge } from "@/components/ui/primitives";
import { statistikAdmin } from "@/lib/admin-queries";
import { getAccessLog, isLoggingConfigured } from "@/lib/queries";
import { contentWriteMode, githubConfigured, githubBranch } from "@/lib/content-write";
import { sheetUrl } from "@/lib/sheets";
import { driveMode } from "@/lib/drive";
import { formatCount } from "@/lib/utils";

/** Satu baris status integrasi — hijau kalau siap, kuning kalau masih sementara. */
function StatusIntegrasi({
  ikon: Ikon,
  judul,
  siap,
  labelStatus,
  children,
}: {
  ikon: typeof GitBranch;
  judul: string;
  siap: boolean;
  labelStatus: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 p-5">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
        <Ikon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{judul}</p>
          <Badge tone={siap ? "success" : "warning"}>{labelStatus}</Badge>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

export default async function RingkasanAdmin() {
  const [stat, jejak] = await Promise.all([statistikAdmin(), getAccessLog(6)]);

  const modeTulis = contentWriteMode();
  const modeDrive = driveMode();
  const jejakSiap = isLoggingConfigured();
  const urlSheet = sheetUrl();

  const kartu = [
    {
      label: "Portofolio",
      utama: stat.proyek.terbit,
      keterangan: `${formatCount(stat.proyek.total)} total · ${formatCount(stat.proyek.total - stat.proyek.terbit)} draf`,
      href: "/admin/portofolio",
    },
    {
      label: "Tulisan publik",
      utama: stat.tulisan.publik,
      keterangan: `${formatCount(stat.tulisan.takTerdaftar)} tak terdaftar · ${formatCount(stat.tulisan.draf)} draf privat`,
      href: "/admin/tulisan",
    },
    {
      label: "Berkas arsip",
      utama: stat.arsip.berkas,
      keterangan: `${formatCount(stat.arsip.mataKuliah)} mata kuliah · ${formatCount(stat.arsip.unduhan)} unduhan tercatat`,
      href: "/admin/arsip",
    },
    {
      label: "Entri CV",
      utama: stat.cv,
      keterangan: "Pendidikan, pengalaman, publikasi",
      href: "/admin/cv",
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="display-lg">Ringkasan</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Semua isi situs disunting dari sini. Setiap simpan menjadi perubahan
          berkas di repositori — jadi ada riwayat versinya, dan tidak ada
          database yang perlu dijaga.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="group bg-background p-5 transition-colors duration-200 hover:bg-muted"
          >
            <p className="eyebrow">{k.label}</p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums">
              {formatCount(k.utama)}
            </p>
            <p className="mt-1.5 text-xs text-subtle">{k.keterangan}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="eyebrow">Aksi cepat</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/admin/tulisan/baru">
            <Plus className="size-4" aria-hidden />
            Tulisan baru
          </ButtonLink>
          <ButtonLink href="/admin/portofolio/baru" variant="outline">
            <Plus className="size-4" aria-hidden />
            Proyek baru
          </ButtonLink>
          <ButtonLink href="/admin/arsip/berkas/baru" variant="outline">
            <Plus className="size-4" aria-hidden />
            Berkas arsip
          </ButtonLink>
          <ButtonLink href="/admin/profil" variant="ghost">
            Sunting profil
          </ButtonLink>
        </div>
      </section>

      <section>
        <h2 className="eyebrow">Status integrasi</h2>
        <div className="mt-4 divide-y divide-border rounded border border-border bg-surface">
          <StatusIntegrasi
            ikon={GitBranch}
            judul="Penyimpanan konten"
            siap={modeTulis === "github" ? githubConfigured() : true}
            labelStatus={modeTulis === "github" ? "Commit ke GitHub" : "Tulis lokal"}
          >
            {modeTulis === "github" ? (
              githubConfigured() ? (
                <>
                  Setiap simpan menjadi satu commit di cabang{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{githubBranch()}</code>,
                  dan Vercel otomatis deploy ulang. Perubahan tampil di situs
                  publik sekitar satu menit setelah disimpan.
                </>
              ) : (
                <>
                  Mode commit aktif tapi kredensialnya belum lengkap. Isi{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GITHUB_TOKEN</code>,{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GITHUB_OWNER</code>, dan{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GITHUB_REPO</code>.
                </>
              )
            ) : (
              <>
                Perubahan langsung ditulis ke berkas di folder{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">content/</code> supaya
                terlihat seketika saat mengembangkan. Commit lewat git seperti biasa.
              </>
            )}
          </StatusIntegrasi>

          <StatusIntegrasi
            ikon={HardDrive}
            judul="Berkas Drive"
            siap={modeDrive === "proxy"}
            labelStatus={modeDrive === "proxy" ? "Mode proxy" : "Mode alih"}
          >
            {modeDrive === "proxy" ? (
              <>
                Berkas disalurkan lewat server. URL Drive tidak pernah sampai ke
                peramban pengunjung, jadi tautannya tidak bisa disebarkan.
              </>
            ) : (
              <>
                Service account belum disetel, jadi pengunjung dialihkan ke tautan
                Drive setelah diverifikasi. Unduhan tetap tercatat, tapi URL
                aslinya bisa terlihat di panel jaringan peramban. Langkahnya ada
                di README bagian Mode proxy Drive.
              </>
            )}
          </StatusIntegrasi>

          <StatusIntegrasi
            ikon={ClipboardList}
            judul="Jejak akses"
            siap={jejakSiap}
            labelStatus={jejakSiap ? "Google Sheets" : "Belum aktif"}
          >
            {jejakSiap ? (
              <>
                Setiap percobaan unduh dicatat sebagai satu baris di Google Sheets.{" "}
                {urlSheet ? (
                  <a
                    href={urlSheet}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-accent"
                  >
                    Buka lembarnya
                  </a>
                ) : null}
              </>
            ) : (
              <>
                Belum ada pencatatan. Isi{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GOOGLE_SHEETS_LOG_ID</code>{" "}
                dan service account Google untuk mengaktifkannya. Gerbang UGM tetap
                berfungsi tanpa ini — yang hilang hanya catatan siapa mengunduh apa.
              </>
            )}
          </StatusIntegrasi>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="eyebrow">Akses arsip terakhir</h2>
          <Link href="/admin/log" className="link-underline inline-flex items-center gap-1 text-sm">
            Semua jejak
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        {jejak.length === 0 ? (
          <p className="mt-4 rounded border border-dashed border-border-strong p-5 text-sm text-muted-foreground">
            {jejakSiap
              ? "Belum ada yang mengakses arsip."
              : "Pencatatan belum aktif, jadi belum ada jejak untuk ditampilkan."}
          </p>
        ) : (
          <ul className="mt-4 flex flex-col rounded border border-border">
            {jejak.map((j, i) => (
              <li
                key={`${j.waktu}-${i}`}
                className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <span className="min-w-0 text-sm">
                  <span className="font-medium">{j.email || "tanpa akun"}</span>
                  <span className="text-muted-foreground"> — {j.berkas || "—"}</span>
                </span>
                <span className="text-xs text-subtle tabular-nums">{j.waktu.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
