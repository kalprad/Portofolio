import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceTable } from "@/components/admin/resource-table";
import { ButtonLink } from "@/components/ui/primitives";
import { Plus } from "lucide-react";
import { getResource } from "@/lib/admin-schema";
import { listRows } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Arsip kuliah" };

export default async function DaftarArsipAdmin() {
  const resource = getResource("arsip");
  const rows = await listRows(resource);

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Arsip kuliah"
        keterangan="Setiap mata kuliah menampung sejumlah berkas. Berkas disimpan sebagai ID Drive dan hanya bisa diunduh lewat server."
        aksiHref="/admin/arsip/baru"
        aksiLabel="Mata kuliah baru"
        pratinjauHref="/arsip"
      />

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/admin/arsip/berkas/baru" variant="outline">
          <Plus className="size-4" aria-hidden />
          Tambah berkas
        </ButtonLink>
      </div>

      <ResourceTable
        resource={resource}
        rows={rows}
        kosongKeterangan="Buat mata kuliah dulu, baru tambahkan berkas ke dalamnya."
      />
    </div>
  );
}
