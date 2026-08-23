import Link from "next/link";
import { ArrowLeft, ExternalLink, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/primitives";

/** Kepala halaman admin: judul, keterangan, dan satu aksi utama. */
export function AdminPageHeader({
  judul,
  keterangan,
  kembaliKe,
  kembaliLabel,
  aksiHref,
  aksiLabel,
  pratinjauHref,
}: {
  judul: string;
  keterangan?: string;
  kembaliKe?: string;
  kembaliLabel?: string;
  aksiHref?: string;
  aksiLabel?: string;
  pratinjauHref?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {kembaliKe ? (
        <Link
          href={kembaliKe}
          className="inline-flex min-h-[44px] w-fit items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {kembaliLabel ?? "Kembali"}
        </Link>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="display-lg">{judul}</h1>
          {keterangan ? <p className="mt-3 text-muted-foreground">{keterangan}</p> : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-3">
          {pratinjauHref ? (
            <ButtonLink
              href={pratinjauHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
            >
              Lihat di situs
              <ExternalLink className="size-3.5" aria-hidden />
            </ButtonLink>
          ) : null}
          {aksiHref ? (
            <ButtonLink href={aksiHref}>
              <Plus className="size-4" aria-hidden />
              {aksiLabel ?? "Tambah"}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </div>
  );
}
