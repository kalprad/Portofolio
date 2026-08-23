import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { DeleteButton } from "@/components/admin/delete-button";
import type { ResourceDef } from "@/lib/admin-schema";

type Baris = Record<string, unknown>;

const NADA_STATUS: Record<string, "neutral" | "accent" | "success" | "warning"> = {
  published: "success",
  draft: "warning",
  public: "success",
  unlisted: "warning",
  private: "neutral",
};

const LABEL_NILAI: Record<string, string> = {
  published: "Terbit",
  draft: "Draf",
  public: "Publik",
  unlisted: "Tak terdaftar",
  private: "Draf privat",
  s1: "S1",
  s2: "S2",
  umum: "Umum",
  ugm: "Khusus UGM",
};

function tampilkanMeta(nilai: unknown): { teks: string; badge: boolean; nada: "neutral" | "accent" | "success" | "warning" } | null {
  if (nilai === null || nilai === undefined || nilai === "") return null;

  const teks = String(nilai);
  const label = LABEL_NILAI[teks];
  if (label) {
    return { teks: label, badge: true, nada: NADA_STATUS[teks] ?? "neutral" };
  }
  return { teks, badge: false, nada: "neutral" };
}

export function ResourceTable({
  resource,
  rows,
  hrefEdit,
  hrefBaru,
  kosongJudul,
  kosongKeterangan,
}: {
  resource: ResourceDef;
  rows: Baris[];
  hrefEdit?: (row: Baris) => string;
  hrefBaru?: string;
  kosongJudul?: string;
  kosongKeterangan?: string;
}) {
  const baru = hrefBaru ?? `${resource.basePath}/baru`;
  const edit = hrefEdit ?? ((row: Baris) => `${resource.basePath}/${row.id}`);

  if (rows.length === 0) {
    return (
      <EmptyState
        title={kosongJudul ?? `Belum ada ${resource.singular.toLowerCase()}`}
        description={kosongKeterangan}
        action={
          <ButtonLink href={baru}>
            <Plus className="size-4" aria-hidden />
            Tambah {resource.singular.toLowerCase()}
          </ButtonLink>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col rounded border border-border">
      {rows.map((row, i) => {
        const judul = String(row[resource.titleField] ?? "(tanpa judul)");
        const meta = (resource.metaFields ?? [])
          .map((f) => tampilkanMeta(row[f]))
          .filter(Boolean);

        return (
          <li
            key={String(row.id)}
            className={i > 0 ? "border-t border-border" : undefined}
          >
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <Link
                  href={edit(row)}
                  className="group inline-flex items-center gap-1.5 font-display text-lg leading-snug"
                >
                  <span className="link-underline">{judul}</span>
                  <ChevronRight
                    className="size-4 shrink-0 text-subtle transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>

                {meta.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {meta.map((m, j) =>
                      m!.badge ? (
                        <Badge key={j} tone={m!.nada}>
                          {m!.teks}
                        </Badge>
                      ) : (
                        <span key={j} className="text-xs text-subtle">
                          {m!.teks}
                        </span>
                      ),
                    )}
                  </div>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <DeleteButton resourceKey={resource.key} id={String(row.id)} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
