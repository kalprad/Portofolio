import type { Metadata } from "next";
import { KerjaSidebar } from "@/components/kerja/kerja-sidebar";
import { listProjects, workspaceSheetsConfigured } from "@/lib/workspace-sheets";

export const metadata: Metadata = {
  title: { default: "Kerja", template: "%s · Kerja · Panel Admin" },
};

// Halaman ini bergantung pada Google Sheets/Calendar yang bisa gagal (kunci
// belum benar, API lagi lambat, dsb). Tanpa `force-dynamic`, Next.js mencoba
// merender halaman ini SEKALI saat build — kalau gagal saat itu, seluruh
// proses build ikut gagal dan situs publik pun tidak ter-deploy. Dengan ini,
// halamannya dirender ulang tiap permintaan, jadi kegagalan di sini cuma
// memengaruhi halaman ini sendiri, bukan seluruh situs.
export const dynamic = "force-dynamic";

export default async function KerjaLayout({ children }: { children: React.ReactNode }) {
  const proyek = workspaceSheetsConfigured() ? await listProjects() : [];

  return (
    <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-10">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <KerjaSidebar proyek={proyek} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
