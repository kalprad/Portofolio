import type { Metadata } from "next";
import { KerjaSidebar } from "@/components/kerja/kerja-sidebar";
import { listProjects, workspaceSheetsConfigured } from "@/lib/workspace-sheets";

export const metadata: Metadata = {
  title: { default: "Kerja", template: "%s · Kerja · Panel Admin" },
};

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
