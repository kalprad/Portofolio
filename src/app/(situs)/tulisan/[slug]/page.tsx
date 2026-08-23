import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, EyeOff } from "lucide-react";
import { Container, Badge } from "@/components/ui/primitives";
import { Markdown } from "@/components/markdown";
import { getPostBySlug, getPosts } from "@/lib/queries";
import { formatFullDate, truncate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tulisan = await getPostBySlug(slug);
  if (!tulisan) return { title: "Tulisan tidak ditemukan" };

  // Tulisan tak terdaftar tidak boleh masuk indeks mesin pencari — itulah
  // seluruh gunanya status ini.
  const takTerdaftar = tulisan.visibility === "unlisted";

  return {
    title: tulisan.title_id,
    description: tulisan.excerpt_id ? truncate(tulisan.excerpt_id, 160) : undefined,
    robots: takTerdaftar ? { index: false, follow: false } : undefined,
    openGraph: takTerdaftar
      ? undefined
      : {
          type: "article",
          title: tulisan.title_id,
          description: tulisan.excerpt_id ?? undefined,
          publishedTime: tulisan.published_at ?? undefined,
          images: tulisan.cover_image_url ? [tulisan.cover_image_url] : undefined,
        },
  };
}

export default async function DetailTulisan({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tulisan = await getPostBySlug(slug);
  if (!tulisan) notFound();

  const lainnya = (await getPosts({ limit: 4 })).filter((p) => p.id !== tulisan.id).slice(0, 3);

  return (
    <Container size="narrow">
      <article className="py-14 sm:py-20">
        <Link
          href="/tulisan"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Semua tulisan
        </Link>

        <header className="mt-6">
          {tulisan.visibility === "unlisted" ? (
            <p className="mb-5 inline-flex items-center gap-2 rounded border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              <EyeOff className="size-3.5 shrink-0" aria-hidden />
              Tulisan ini tak terdaftar — hanya bisa dibuka lewat tautan langsung
              dan tidak diindeks mesin pencari.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-subtle">
            <time dateTime={tulisan.published_at ?? undefined} className="tabular-nums">
              {formatFullDate(tulisan.published_at)}
            </time>
            {tulisan.category ? <span>· {tulisan.category}</span> : null}
            {tulisan.reading_minutes ? <span>· {tulisan.reading_minutes} menit baca</span> : null}
          </div>

          <h1 className="display-lg mt-4">{tulisan.title_id}</h1>

          {tulisan.excerpt_id ? (
            <p className="mt-5 text-lg text-muted-foreground">{tulisan.excerpt_id}</p>
          ) : null}
        </header>

        {tulisan.cover_image_url ? (
          <div className="mt-10 overflow-hidden rounded border border-border">
            <Image
              src={tulisan.cover_image_url}
              alt={tulisan.title_id}
              width={1400}
              height={788}
              className="aspect-[16/9] w-full object-cover"
              priority
            />
          </div>
        ) : null}

        <div className="mt-10">
          <Markdown>{tulisan.body_id}</Markdown>
        </div>

        {tulisan.tags.length > 0 ? (
          <div className="mt-12 flex flex-wrap gap-1.5 border-t border-border pt-6">
            {tulisan.tags.map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        ) : null}

        {lainnya.length > 0 ? (
          <section className="mt-20 border-t border-border pt-10">
            <h2 className="eyebrow">Tulisan lain</h2>
            <ul className="mt-5 flex flex-col">
              {lainnya.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/tulisan/${p.slug}`}
                    className="flex min-h-[64px] flex-col justify-center gap-1 border-b border-border py-4 transition-colors duration-200 hover:bg-muted"
                  >
                    <span className="font-display text-lg leading-snug">{p.title_id}</span>
                    <span className="text-xs text-subtle tabular-nums">
                      {formatFullDate(p.published_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </Container>
  );
}
