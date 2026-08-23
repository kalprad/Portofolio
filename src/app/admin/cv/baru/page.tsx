import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";

export const metadata: Metadata = { title: "Entri CV baru" };

export default function EntriCvBaru() {
  const resource = getResource("cv");

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader judul="Entri CV baru" kembaliKe="/admin/cv" kembaliLabel="Daftar CV" />
      <EntityForm
        resource={resource}
        data={{ section: "pengalaman", is_published: true, sort_order: 0, is_current: false }}
        batalKe="/admin/cv"
      />
    </div>
  );
}
