import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceTable } from "@/components/admin/resource-table";
import { getResource } from "@/lib/admin-schema";
import { listRows, collectionOptions } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Berkas arsip" };

export default async function DaftarBerkasAdmin() {
  const resource = getResource("berkas");
  const [rows, opsi] = await Promise.all([listRows(resource), collectionOptions()]);

  const namaKoleksi = new Map(opsi.map((o) => [o.value, o.label]));

  // Dikelompokkan per mata kuliah: daftar berkas datar cepat jadi tidak terbaca
  // begitu jumlahnya lewat dua puluhan.
  const perKoleksi = new Map<string, Record<string, unknown>[]>();
  for (const r of rows) {
    const k = String(r.collection_id ?? "tanpa-koleksi");
    const list = perKoleksi.get(k) ?? [];
    list.push(r);
    perKoleksi.set(k, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Berkas arsip"
        keterangan="Seluruh berkas dari semua mata kuliah."
        kembaliKe="/admin/arsip"
        kembaliLabel="Daftar mata kuliah"
        aksiHref="/admin/arsip/berkas/baru"
        aksiLabel="Berkas baru"
      />

      {rows.length === 0 ? (
        <ResourceTable
          resource={resource}
          rows={[]}
          kosongKeterangan="Buat mata kuliah dulu, lalu tambahkan berkas ke dalamnya."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {Array.from(perKoleksi.entries()).map(([idKoleksi, list]) => (
            <section key={idKoleksi}>
              <h2 className="eyebrow">
                {namaKoleksi.get(idKoleksi) ?? "Tanpa mata kuliah"}
              </h2>
              <div className="mt-4">
                <ResourceTable resource={resource} rows={list} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
