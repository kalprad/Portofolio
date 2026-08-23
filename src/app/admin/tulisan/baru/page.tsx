import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";

export const metadata: Metadata = { title: "Tulisan baru" };

export default function TulisanBaru() {
  const resource = getResource("posts");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Tulisan baru"
        keterangan="Dimulai sebagai draf privat. Naikkan tingkat privasinya saat siap."
        kembaliKe="/admin/tulisan"
        kembaliLabel="Daftar tulisan"
      />
      <EntityForm
        resource={resource}
        data={{ visibility: "private" }}
        batalKe="/admin/tulisan"
      />
    </div>
  );
}
