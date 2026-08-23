import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { ResourceTable } from "@/components/admin/resource-table";
import { ButtonLink } from "@/components/ui/primitives";
import { getResource } from "@/lib/admin-schema";
import { getRow, listItemsByCollection } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Sunting mata kuliah" };

export default async function SuntingMataKuliah({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResource("arsip");
  const resourceBerkas = getResource("berkas");

  const data = await getRow(resource, id);
  if (!data) notFound();

  const berkas = await listItemsByCollection(id);
  const slug = typeof data.slug === "string" ? data.slug : null;

  return (
    <div className="flex flex-col gap-10">
      <AdminPageHeader
        judul={String(data.title_id ?? "Sunting mata kuliah")}
        kembaliKe="/admin/arsip"
        kembaliLabel="Daftar arsip"
        pratinjauHref={slug && data.is_published ? `/arsip/${slug}` : undefined}
      />

      <EntityForm resource={resource} data={data} id={id} batalKe="/admin/arsip" />

      <section className="border-t border-border pt-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Berkas mata kuliah ini</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {berkas.length} berkas terdaftar.
            </p>
          </div>
          <ButtonLink href={`/admin/arsip/berkas/baru?koleksi=${id}`} variant="outline">
            <Plus className="size-4" aria-hidden />
            Tambah berkas
          </ButtonLink>
        </div>

        <div className="mt-6">
          <ResourceTable
            resource={resourceBerkas}
            rows={berkas}
            hrefBaru={`/admin/arsip/berkas/baru?koleksi=${id}`}
            kosongJudul="Belum ada berkas di mata kuliah ini"
            kosongKeterangan="Tempel URL Drive atau ID berkasnya saat menambahkan."
          />
        </div>
      </section>
    </div>
  );
}
