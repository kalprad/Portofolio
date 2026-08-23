import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Download, Mail } from "lucide-react";
import { Container, SectionHeading, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { ProjectCard, PostCard } from "@/components/cards";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SocialIcon } from "@/components/social-icon";
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
  const [namaDepan, ...sisaNama] = nama.split(" ");
  const namaBelakang = sisaNama.join(" ");
  const sosial = profile?.social_links ?? [];

  return (
    <>
      {/* ---- Hero -------------------------------------------------------- */}
      <section className="border-b border-border">
        <Container size="wide">
          <div className="reveal grid gap-14 py-16 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
            <div>
              <p className="text-sm text-muted-foreground">Halo, saya</p>

              {/* Nama dan bagian gradiennya masing-masing baris sendiri (bukan
                  mengalir satu baris) — kalau dibiarkan bebas membungkus,
                  gradien diagonal bisa terputus di tengah kata saat kata
                  keduanya jatuh ke baris berikutnya. */}
              <h1 className="display-xl mt-4 flex flex-col">
                <span>{namaDepan}</span>
                {namaBelakang ? (
                  <span className="text-gradient-accent">{namaBelakang}</span>
                ) : null}
              </h1>

              <p className="mt-3 text-2xl text-muted-foreground sm:text-3xl">
                {profile?.tagline_id ?? headline}
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                {profile?.cv_file_url ? (
                  <ButtonLink href={profile.cv_file_url} size="lg" target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" aria-hidden />
                    Unduh CV
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/cv" size="lg">
                    <Download className="size-4" aria-hidden />
                    Lihat CV
                  </ButtonLink>
                )}
                {profile?.email ? (
                  <ButtonLink href={`mailto:${profile.email}`} variant="outline" size="lg">
                    <Mail className="size-4" aria-hidden />
                    Hubungi saya
                  </ButtonLink>
                ) : (
                  <ButtonLink href="/tentang" variant="outline" size="lg">
                    Tentang saya
                  </ButtonLink>
                )}
              </div>

              {sosial.length > 0 ? (
                <ul className="mt-8 flex flex-wrap items-center gap-4">
                  {sosial.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                      >
                        <SocialIcon label={s.label} className="size-[18px]" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {profile?.hero_photo_url ? (
              <div className="mx-auto w-full max-w-sm">
                <div className="hero-photo-glow relative aspect-square overflow-hidden rounded-full border border-border">
                  <Image
                    src={profile.hero_photo_url}
                    alt={`Foto ${nama}`}
                    fill
                    sizes="(min-width: 1024px) 24rem, 60vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      {/* ---- Proyek pilihan ---------------------------------------------- */}
      <section className="py-20 sm:py-24">
        <Container size="wide">
          <ScrollReveal>
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
          </ScrollReveal>

          <div className="mt-12">
            {proyek.length > 0 ? (
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
                {proyek.map((p, i) => (
                  <ScrollReveal key={p.id} delay={i * 80}>
                    <ProjectCard project={p} />
                  </ScrollReveal>
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
          <ScrollReveal>
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
          </ScrollReveal>

          <div className="mt-8 max-w-3xl">
            {tulisan.length > 0 ? (
              tulisan.map((t, i) => (
                <ScrollReveal key={t.id} delay={i * 80}>
                  <PostCard post={t} />
                </ScrollReveal>
              ))
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
          <ScrollReveal>
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
          </ScrollReveal>
        </Container>
      </section>
    </>
  );
}
