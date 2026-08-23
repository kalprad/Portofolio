import Link from "next/link";
import { ArrowUpRight, Lock, Folder } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { formatFullDate, formatYearRange, formatCount } from "@/lib/utils";
import { pick, type Locale } from "@/lib/i18n";
import { LEVEL_LABEL, type ArchiveCollection, type Post, type Project } from "@/lib/types";

export function ProjectCard({
  project,
  locale = "id",
}: {
  project: Project;
  locale?: Locale;
}) {
  const judul = pick(project, "title", locale);
  const ringkas = pick(project, "summary", locale);
  const tahun = formatYearRange(project.year_start, project.year_end);

  return (
    <article className="group relative flex flex-col border-t border-border pt-6">
      <div className="flex items-baseline gap-3 text-xs text-subtle">
        {tahun ? <span className="tabular-nums">{tahun}</span> : null}
        {project.category ? <span>· {project.category}</span> : null}
      </div>

      <h3 className="mt-3 text-2xl leading-snug">
        <Link href={`/portofolio/${project.slug}`} className="link-underline">
          <span className="absolute inset-0" aria-hidden />
          {judul}
        </Link>
      </h3>

      {ringkas ? (
        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{ringkas}</p>
      ) : null}

      {project.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.slice(0, 4).map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      ) : null}

      <span className="mt-5 inline-flex items-center gap-1 text-sm text-accent">
        Lihat proyek
        <ArrowUpRight
          className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </span>
    </article>
  );
}

export function PostCard({ post, locale = "id" }: { post: Post; locale?: Locale }) {
  const judul = pick(post, "title", locale);
  const cuplikan = pick(post, "excerpt", locale);

  return (
    <article className="group relative border-t border-border py-6">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-subtle">
        <time dateTime={post.published_at ?? undefined}>
          {formatFullDate(post.published_at)}
        </time>
        {post.category ? <span>· {post.category}</span> : null}
        {post.reading_minutes ? <span>· {post.reading_minutes} menit baca</span> : null}
      </div>

      <h3 className="mt-2 text-2xl leading-snug">
        <Link href={`/tulisan/${post.slug}`} className="link-underline">
          <span className="absolute inset-0" aria-hidden />
          {judul}
        </Link>
      </h3>

      {cuplikan ? (
        <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">{cuplikan}</p>
      ) : null}
    </article>
  );
}

export function ArchiveCard({
  collection,
  jumlahBerkas,
  locale = "id",
}: {
  collection: ArchiveCollection;
  jumlahBerkas: number;
  locale?: Locale;
}) {
  const judul = pick(collection, "title", locale);
  const deskripsi = pick(collection, "description", locale);

  return (
    <article className="group relative flex flex-col rounded border border-border bg-surface p-6 transition-colors duration-200 hover:border-border-strong">
      <div className="flex items-center gap-2">
        <Badge tone="accent">{LEVEL_LABEL[collection.level]}</Badge>
        {collection.semester ? <Badge>Semester {collection.semester}</Badge> : null}
        {collection.course_code ? (
          <span className="text-xs text-subtle">{collection.course_code}</span>
        ) : null}
      </div>

      <h3 className="mt-4 text-xl leading-snug">
        <Link href={`/arsip/${collection.slug}`} className="link-underline">
          <span className="absolute inset-0" aria-hidden />
          {judul}
        </Link>
      </h3>

      {deskripsi ? (
        <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">{deskripsi}</p>
      ) : null}

      <div className="mt-5 flex items-center gap-4 text-xs text-subtle">
        <span className="inline-flex items-center gap-1.5">
          <Folder className="size-3.5" aria-hidden />
          {formatCount(jumlahBerkas)} berkas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5" aria-hidden />
          Perlu akun UGM
        </span>
      </div>
    </article>
  );
}
