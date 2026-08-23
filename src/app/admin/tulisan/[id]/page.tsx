import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";
import { getRow } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Sunting tulisan" };

export default async function SuntingTulisan({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResource("posts");
  const data = await getRow(resource, id);
  if (!data) notFound();

  const slug = typeof data.slug === "string" ? data.slug : null;
  // Draf privat belum punya halaman publik, jadi tombol pratinjau disembunyikan.
  const bisaDilihat = slug && data.visibility !== "private";

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul={String(data.title_id ?? "Sunting tulisan")}
        kembaliKe="/admin/tulisan"
        kembaliLabel="Daftar tulisan"
        pratinjauHref={bisaDilihat ? `/tulisan/${slug}` : undefined}
      />
      <EntityForm resource={resource} data={data} id={id} batalKe="/admin/tulisan" />
    </div>
  );
}
