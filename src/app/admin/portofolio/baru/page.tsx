import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";

export const metadata: Metadata = { title: "Proyek baru" };

export default function ProyekBaru() {
  const resource = getResource("projects");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Proyek baru"
        kembaliKe="/admin/portofolio"
        kembaliLabel="Daftar portofolio"
      />
      <EntityForm
        resource={resource}
        data={{ status: "draft", sort_order: 0, is_featured: false }}
        batalKe="/admin/portofolio"
      />
    </div>
  );
}
