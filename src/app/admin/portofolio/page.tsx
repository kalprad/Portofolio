import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceTable } from "@/components/admin/resource-table";
import { getResource } from "@/lib/admin-schema";
import { listRows } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Portofolio" };

export default async function DaftarProyekAdmin() {
  const resource = getResource("projects");
  const rows = await listRows(resource);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Portofolio"
        keterangan="Proyek dan riset. Hanya yang berstatus terbit yang tampil di situs."
        aksiHref="/admin/portofolio/baru"
        aksiLabel="Proyek baru"
        pratinjauHref="/portofolio"
      />
      <ResourceTable
        resource={resource}
        rows={rows}
        kosongKeterangan="Tambahkan proyek pertama, lalu tandai sebagai pilihan supaya muncul di beranda."
      />
    </div>
  );
}
