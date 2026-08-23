import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container, SectionHeading, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { ProjectCard, PostCard } from "@/components/cards";
import { getProfile, getProjects, getPosts, getArchiveCollections } from "@/lib/queries";

export default async function Beranda() {
  const [profile, proyek, tulisan, arsip] = await Promise.all([
    getProfile(),
    getProjects({ featuredOnly: true, limit: 3 }),
    getPosts({ limit: 3 }),
    getArchiveCollections(),
  ]);

  const nama = profile?.full_name ?? "Rizki Haikal";
  const headline = profile?.headline_id ?? "Structural Engineer & Researcher";

  return (
    <>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className="border-b border-border">
        <Container size="wide">
          <div className="reveal py-20 sm:py-28 lg:py-36">
            {profile?.location ? (
              <p className="eyebrow">{profile.location}</p>
            ) : null}

            <h1 className="display-xl mt-6 max-w-4xl uppercase">{headline}</h1>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <p className="max-w-xl text-lg text-muted-foreground">
                {profile?.tagline_id ??
                  "Meneliti efektivitas damper pada struktur slab on pile."}
              </p>

              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/portofolio" size="lg">
                  Lihat portofolio
                  <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/tentang" variant="outline" size="lg">
                  Tentang saya
                </ButtonLink>
              </div>
            </div>

            <p className="mt-14 font-display text-2xl text-subtle">{nama}</p>
          </div>
        </Container>
      </section>

      {/* ---- Proyek pilihan ---------------------------------------------- */}
      <section className="py-20 sm:py-24">
        <Container size="wide">
          <SectionHeading
            eyebrow="Portofolio"
            title="Pekerjaan pilihan"
            description="Proyek dan riset yang paling menggambarkan cara saya bekerja."
            action={
              <Link
                href="/portofolio"
                className="link-underline inline-flex items-center gap-1 text-sm"
              >
                Semua proyek
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            }
          />

          <div className="mt-12">
            {proyek.length > 0 ? (
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                {proyek.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Belum ada proyek yang ditandai pilihan"
                description="Tandai proyek sebagai pilihan lewat panel admin supaya muncul di beranda."
              />
            )}
          </div>
        </Container>
      </section>

      {/* ---- Tulisan terbaru --------------------------------------------- */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container size="wide">
          <SectionHeading
            eyebrow="Tulisan"
            title="Catatan terbaru"
            description="Catatan teknik, proses riset, dan sesekali hal yang lebih personal."
            action={
              <Link
                href="/tulisan"
                className="link-underline inline-flex items-center gap-1 text-sm"
              >
                Semua tulisan
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            }
          />

          <div className="mt-8 max-w-3xl">
            {tulisan.length > 0 ? (
              tulisan.map((t) => <PostCard key={t.id} post={t} />)
            ) : (
              <EmptyState
                title="Belum ada tulisan terbit"
                description="Tulisan yang berstatus publik akan muncul di sini."
              />
            )}
          </div>
        </Container>
      </section>

      {/* ---- Arsip kuliah ------------------------------------------------ */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Arsip Kuliah</p>
              <h2 className="display-lg mt-3">
                Materi S1 &amp; S2, dirapikan supaya bisa dipakai ulang
              </h2>
              <p className="mt-5 max-w-xl text-muted-foreground">
                Slide, catatan, bank soal, dan modul praktikum dari mata kuliah
                yang saya ambil. Terbuka untuk sesama mahasiswa UGM — cukup masuk
                dengan akun Google UGM untuk membuka unduhannya.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/arsip" size="lg">
                  Buka arsip
                  <ArrowRight className="size-4" aria-hidden />
                </ButtonLink>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border">
              <div className="bg-background p-6">
                <dt className="eyebrow">Mata kuliah</dt>
                <dd className="mt-2 font-display text-4xl tabular-nums">
                  {arsip.length}
                </dd>
              </div>
              <div className="bg-background p-6">
                <dt className="eyebrow">Jenjang</dt>
                <dd className="mt-2 font-display text-4xl">S1 · S2</dd>
              </div>
            </dl>
          </div>
        </Container>
      </section>
    </>
  );
}
