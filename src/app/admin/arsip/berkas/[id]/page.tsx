import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { Badge } from "@/components/ui/primitives";
import { getResource } from "@/lib/admin-schema";
import { getRow, collectionOptions } from "@/lib/admin-queries";
import { ARCHIVE_KIND_LABEL } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Sunting berkas arsip" };

export default async function SuntingBerkas({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResource("berkas");

  const [data, opsi] = await Promise.all([getRow(resource, id), collectionOptions()]);
  if (!data) notFound();

  const kembaliKe = data.collection_id
    ? `/admin/arsip/${String(data.collection_id)}`
    : "/admin/arsip";

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul={String(data.title_id ?? "Sunting berkas")}
        kembaliKe={kembaliKe}
        kembaliLabel="Kembali ke mata kuliah"
      />

      <div className="flex flex-wrap items-center gap-3 rounded border border-border bg-surface px-5 py-4 text-sm">
        <Badge>{ARCHIVE_KIND_LABEL[data.kind as keyof typeof ARCHIVE_KIND_LABEL] ?? "Berkas"}</Badge>
        {data.file_size_bytes ? (
          <span className="text-muted-foreground">
            {formatBytes(Number(data.file_size_bytes))}
          </span>
        ) : null}
        {data.mime_type ? (
          <span className="text-subtle">{String(data.mime_type)}</span>
        ) : null}
      </div>

      <EntityForm
        resource={resource}
        data={data}
        id={id}
        opsiDinamis={{ collection_id: opsi }}
        batalKe={kembaliKe}
      />
    </div>
  );
}
