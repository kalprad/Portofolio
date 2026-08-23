import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceTable } from "@/components/admin/resource-table";
import { getResource } from "@/lib/admin-schema";
import { listRows } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Tulisan" };

export default async function DaftarTulisanAdmin() {
  const resource = getResource("posts");
  const rows = await listRows(resource);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Tulisan"
        keterangan="Tiga tingkat privasi: draf privat hanya untuk Anda, tak terdaftar bisa dibuka lewat tautan langsung, publik tampil di daftar dan mesin pencari."
        aksiHref="/admin/tulisan/baru"
        aksiLabel="Tulisan baru"
        pratinjauHref="/tulisan"
      />
      <ResourceTable
        resource={resource}
        rows={rows}
        kosongKeterangan="Mulai dari draf privat — statusnya bisa dinaikkan kapan saja."
      />
    </div>
  );
}
