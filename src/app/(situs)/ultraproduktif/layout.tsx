import type { Metadata } from "next";
import { KerjaSidebar } from "@/components/kerja/kerja-sidebar";
import { KerjaBottomNav } from "@/components/kerja/kerja-bottom-nav";
import { QuickAddSheet } from "@/components/kerja/quick-add-sheet";
import { listProjects, workspaceSheetsConfigured } from "@/lib/workspace-sheets";

export const metadata: Metadata = {
  title: { default: "Ultraproduktif", template: "%s · Ultraproduktif" },
  // Privat — cuma pemilik situs yang bisa membuka (dijaga middleware), tapi
  // tetap tidak perlu masuk indeks mesin pencari.
  robots: { index: false, follow: false },
  // Manifest & ikon di-scope ke /ultraproduktif saja (lewat metadata
  // per-segmen Next.js) — situs portofolio publik tidak ikut jadi "app".
  manifest: "/manifest-ultraproduktif.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ultraproduktif" },
  icons: {
    icon: [
      { url: "/icons/ultraproduktif-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/ultraproduktif-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/ultraproduktif-apple-touch.png",
  },
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
      <div className="min-w-0 pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">{children}</div>

      <KerjaBottomNav proyek={proyek} />
      <QuickAddSheet proyek={proyek} />
    </div>
  );
}
