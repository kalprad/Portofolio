import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";
import { getRow } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Sunting entri CV" };

export default async function SuntingEntriCv({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResource("cv");
  const data = await getRow(resource, id);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul={String(data.title_id ?? "Sunting entri CV")}
        kembaliKe="/admin/cv"
        kembaliLabel="Daftar CV"
        pratinjauHref="/cv"
      />
      <EntityForm resource={resource} data={data} id={id} batalKe="/admin/cv" />
    </div>
  );
}
