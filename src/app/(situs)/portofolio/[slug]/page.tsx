import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Container, Badge, ButtonLink } from "@/components/ui/primitives";
import { Markdown } from "@/components/markdown";
import { getProjectBySlug, getProjects } from "@/lib/queries";
import { formatYearRange, truncate } from "@/lib/utils";
import type { GalleryImage } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const proyek = await getProjectBySlug(slug);
  if (!proyek) return { title: "Proyek tidak ditemukan" };

  return {
    title: proyek.title_id,
    description: proyek.summary_id ? truncate(proyek.summary_id, 160) : undefined,
    openGraph: {
      title: proyek.title_id,
      description: proyek.summary_id ?? undefined,
      images: proyek.cover_image_url ? [proyek.cover_image_url] : undefined,
    },
  };
}

export default async function DetailProyek({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proyek = await getProjectBySlug(slug);
  if (!proyek) notFound();

  const lainnya = (await getProjects({ limit: 4 })).filter((p) => p.id !== proyek.id).slice(0, 3);
  const galeri = (proyek.gallery ?? []) as GalleryImage[];

  return (
    <Container size="default">
      <div className="py-14 sm:py-20">
        <Link
          href="/portofolio"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Semua proyek
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-subtle">
            {proyek.category ? <Badge tone="accent">{proyek.category}</Badge> : null}
            {formatYearRange(proyek.year_start, proyek.year_end) ? (
              <span className="tabular-nums">
                {formatYearRange(proyek.year_start, proyek.year_end)}
              </span>
            ) : null}
          </div>

          <h1 className="display-lg mt-4">{proyek.title_id}</h1>

          {proyek.summary_id ? (
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{proyek.summary_id}</p>
          ) : null}
        </header>

        {proyek.cover_image_url ? (
          <div className="mt-10 overflow-hidden rounded border border-border">
            <Image
              src={proyek.cover_image_url}
              alt={proyek.title_id}
              width={1600}
              height={900}
              className="aspect-[16/9] w-full object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_240px] lg:gap-16">
          <div className="min-w-0">
            <Markdown>{proyek.body_id}</Markdown>

            {galeri.length > 0 ? (
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                {galeri.map((g, i) => (
                  <figure key={`${g.url}-${i}`}>
                    <div className="overflow-hidden rounded border border-border">
                      <Image
                        src={g.url}
                        alt={g.caption ?? `${proyek.title_id} — gambar ${i + 1}`}
                        width={800}
                        height={600}
                        className="aspect-[4/3] w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {g.caption ? (
                      <figcaption className="mt-2 text-xs text-subtle">{g.caption}</figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <dl className="flex flex-col gap-5 text-sm">
              {proyek.role ? (
                <div className="border-t border-border pt-4">
                  <dt className="eyebrow">Peran</dt>
                  <dd className="mt-1.5">{proyek.role}</dd>
                </div>
              ) : null}
              {proyek.client ? (
                <div className="border-t border-border pt-4">
                  <dt className="eyebrow">Pemberi kerja</dt>
                  <dd className="mt-1.5">{proyek.client}</dd>
                </div>
              ) : null}
              {proyek.location ? (
                <div className="border-t border-border pt-4">
                  <dt className="eyebrow">Lokasi</dt>
                  <dd className="mt-1.5">{proyek.location}</dd>
                </div>
              ) : null}
              {proyek.tags.length > 0 ? (
                <div className="border-t border-border pt-4">
                  <dt className="eyebrow">Kata kunci</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {proyek.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>

            {proyek.external_url ? (
              <ButtonLink
                href={proyek.external_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                className="mt-6 w-full"
              >
                Tautan terkait
                <ExternalLink className="size-4" aria-hidden />
              </ButtonLink>
            ) : null}
          </aside>
        </div>

        {lainnya.length > 0 ? (
          <section className="mt-24 border-t border-border pt-12">
            <h2 className="eyebrow">Proyek lain</h2>
            <ul className="mt-6 flex flex-col">
              {lainnya.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/portofolio/${p.slug}`}
                    className="group flex min-h-[64px] items-center justify-between gap-6 border-b border-border py-4 transition-colors duration-200 hover:bg-muted"
                  >
                    <span className="font-display text-lg">{p.title_id}</span>
                    <span className="shrink-0 text-xs text-subtle tabular-nums">
                      {formatYearRange(p.year_start, p.year_end)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Container>
  );
}
