import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";

export const metadata: Metadata = { title: "Mata kuliah baru" };

export default function MataKuliahBaru() {
  const resource = getResource("arsip");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Mata kuliah baru"
        kembaliKe="/admin/arsip"
        kembaliLabel="Daftar arsip"
      />
      <EntityForm
        resource={resource}
        data={{ level: "s1", is_published: false, sort_order: 0 }}
        batalKe="/admin/arsip"
      />
    </div>
  );
}
