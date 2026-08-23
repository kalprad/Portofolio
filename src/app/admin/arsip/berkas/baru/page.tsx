import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";
import { collectionOptions } from "@/lib/admin-queries";
import { driveMode } from "@/lib/drive";

export const metadata: Metadata = { title: "Berkas arsip baru" };

export default async function BerkasBaru({
  searchParams,
}: {
  searchParams: Promise<{ koleksi?: string }>;
}) {
  const { koleksi } = await searchParams;
  const resource = getResource("berkas");
  const opsi = await collectionOptions();

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Berkas arsip baru"
        keterangan={
          driveMode() === "proxy"
            ? "Berkas disalurkan lewat server, jadi berkas di Drive boleh tetap privat — cukup bagikan ke alamat service account sebagai Viewer."
            : "Service account belum disetel, jadi berkas harus disetel 'siapa saja yang memiliki link' di Drive agar pengalihan berhasil."
        }
        kembaliKe={koleksi ? `/admin/arsip/${koleksi}` : "/admin/arsip"}
        kembaliLabel={koleksi ? "Kembali ke mata kuliah" : "Daftar arsip"}
      />
      <EntityForm
        resource={resource}
        data={{
          collection_id: koleksi ?? "",
          kind: "slide",
          access_level: "ugm",
          is_published: true,
          sort_order: 0,
        }}
        opsiDinamis={{ collection_id: opsi }}
        batalKe={koleksi ? `/admin/arsip/${koleksi}` : "/admin/arsip"}
      />
    </div>
  );
}
