import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock, FolderOpen, AlertCircle } from "lucide-react";
import { Container, Badge, EmptyState, buttonClass } from "@/components/ui/primitives";
import { UgmGate } from "@/components/ugm-gate";
import { sesiAman } from "@/lib/auth";
import { getArchiveCollectionBySlug, getArchiveItems } from "@/lib/queries";
import { ARCHIVE_KIND_LABEL, LEVEL_LABEL } from "@/lib/types";
import { formatBytes, formatCount, truncate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const koleksi = await getArchiveCollectionBySlug(slug);
  if (!koleksi) return { title: "Arsip tidak ditemukan" };

  return {
    title: koleksi.title_id,
    description: koleksi.description_id ? truncate(koleksi.description_id, 160) : undefined,
  };
}

export default async function DetailArsip({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ perlu?: string }>;
}) {
  const [{ slug }, { perlu }] = await Promise.all([params, searchParams]);
  const [session, koleksi] = await Promise.all([sesiAman(), getArchiveCollectionBySlug(slug)]);
  if (!koleksi) notFound();

  const berkas = await getArchiveItems(koleksi.id);
  const bolehUnduh = Boolean(session?.user?.isUgm);

  return (
    <Container size="default">
      <div className="py-14 sm:py-20">
        <Link
          href="/arsip"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Semua mata kuliah
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{LEVEL_LABEL[koleksi.level]}</Badge>
            {koleksi.semester ? <Badge>Semester {koleksi.semester}</Badge> : null}
            {koleksi.course_code ? <Badge>{koleksi.course_code}</Badge> : null}
            {koleksi.credits ? <Badge>{koleksi.credits} SKS</Badge> : null}
          </div>

          <h1 className="display-lg mt-4">{koleksi.title_id}</h1>

          {koleksi.description_id ? (
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {koleksi.description_id}
            </p>
          ) : null}

          {koleksi.lecturer ? (
            <p className="mt-3 text-sm text-subtle">Pengampu: {koleksi.lecturer}</p>
          ) : null}
        </header>

        {/* Datang dari rute unduh yang menolak: jelaskan kenapa halaman ini
            terbuka lagi, jangan biarkan pengunjung menebak. */}
        {perlu === "ugm" && !bolehUnduh ? (
          <p
            role="alert"
            className="mt-8 flex items-start gap-2.5 rounded border border-warning/40 bg-muted px-4 py-3 text-sm text-warning"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Unduhan itu perlu akun UGM terverifikasi. Masuk dulu lewat kotak di
            bawah, lalu coba lagi.
          </p>
        ) : null}

        {/* Gerbang tampil di atas daftar: pengunjung tahu apa yang tersedia
            sebelum diminta masuk, jadi ada alasan jelas untuk login. */}
        {!bolehUnduh ? (
          <div className="mt-10">
            <UgmGate
              sudahMasuk={Boolean(session?.user)}
              emailPengguna={session?.user?.email}
              tujuan={`/arsip/${koleksi.slug}`}
            />
          </div>
        ) : null}

        <section className="mt-12">
          <h2 className="eyebrow">Berkas ({formatCount(berkas.length)})</h2>

          {berkas.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="Belum ada berkas di mata kuliah ini"
                description="Berkas akan muncul begitu ditambahkan lewat panel admin."
              />
            </div>
          ) : (
            <ul className="mt-5 flex flex-col">
              {berkas.map((b) => {
                const isFolder = Boolean(b.drive_folder_id) && !b.drive_file_id;

                return (
                  <li
                    key={b.id}
                    className="flex flex-col gap-4 border-t border-border py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{ARCHIVE_KIND_LABEL[b.kind]}</Badge>
                        {b.file_size_bytes ? (
                          <span className="text-xs text-subtle tabular-nums">
                            {formatBytes(b.file_size_bytes)}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 font-display text-lg leading-snug">{b.title_id}</p>

                      {b.description_id ? (
                        <p className="mt-1 text-sm text-muted-foreground">{b.description_id}</p>
                      ) : null}
                    </div>

                    <div className="shrink-0">
                      {bolehUnduh ? (
                        <a
                          href={`/api/arsip/${b.id}/unduh`}
                          className={buttonClass("outline", "sm")}
                          // Bukan navigasi biasa: biarkan peramban menangani
                          // respons unduhan tanpa mengganti halaman.
                          rel="nofollow"
                        >
                          {isFolder ? (
                            <>
                              <FolderOpen className="size-4" aria-hidden />
                              Buka folder
                            </>
                          ) : (
                            <>
                              <Download className="size-4" aria-hidden />
                              Unduh
                            </>
                          )}
                        </a>
                      ) : (
                        <span
                          className="inline-flex min-h-[38px] items-center gap-2 rounded border border-border px-3 text-sm text-subtle"
                          title="Masuk dengan akun UGM untuk mengunduh"
                        >
                          <Lock className="size-4" aria-hidden />
                          Terkunci
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Container>
  );
}
