import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResourceTable } from "@/components/admin/resource-table";
import { getResource } from "@/lib/admin-schema";
import { listRows } from "@/lib/admin-queries";
import { CV_SECTION_LABEL, CV_SECTION_ORDER, type CvSection } from "@/lib/types";

export const metadata: Metadata = { title: "Entri CV" };

export default async function DaftarCvAdmin() {
  const resource = getResource("cv");
  const rows = await listRows(resource);

  // Dikelompokkan per bagian: mengurutkan CV jauh lebih mudah kalau entri yang
  // sejenis berdekatan.
  const perSeksi = new Map<string, Record<string, unknown>[]>();
  for (const r of rows) {
    const s = String(r.section ?? "lainnya");
    const list = perSeksi.get(s) ?? [];
    list.push(r);
    perSeksi.set(s, list);
  }

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Entri CV"
        keterangan="Pendidikan, pengalaman, publikasi, dan seterusnya. Urutan di dalam tiap bagian diatur lewat kolom Urutan."
        aksiHref="/admin/cv/baru"
        aksiLabel="Entri baru"
        pratinjauHref="/cv"
      />

      {rows.length === 0 ? (
        <ResourceTable
          resource={resource}
          rows={[]}
          kosongKeterangan="Mulai dari pendidikan dan pengalaman terakhir."
        />
      ) : (
        <div className="flex flex-col gap-10">
          {CV_SECTION_ORDER.map((seksi: CvSection) => {
            const list = perSeksi.get(seksi);
            if (!list || list.length === 0) return null;

            return (
              <section key={seksi}>
                <h2 className="eyebrow">{CV_SECTION_LABEL[seksi]}</h2>
                <div className="mt-4">
                  <ResourceTable resource={resource} rows={list} />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
