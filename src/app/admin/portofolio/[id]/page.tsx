import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";
import { getRow } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Sunting proyek" };

export default async function SuntingProyek({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResource("projects");
  const data = await getRow(resource, id);
  if (!data) notFound();

  const slug = typeof data.slug === "string" ? data.slug : null;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul={String(data.title_id ?? "Sunting proyek")}
        kembaliKe="/admin/portofolio"
        kembaliLabel="Daftar portofolio"
        pratinjauHref={
          slug && data.status === "published" ? `/portofolio/${slug}` : undefined
        }
      />
      <EntityForm resource={resource} data={data} id={id} batalKe="/admin/portofolio" />
    </div>
  );
}
