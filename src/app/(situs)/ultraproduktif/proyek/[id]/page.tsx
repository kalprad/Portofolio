import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PapanTugas } from "@/components/kerja/papan-tugas";
import { CatatanPanel } from "@/components/kerja/catatan-panel";
import { ProyekHeader } from "@/components/kerja/proyek-header";
import { KirimRingkasanForm } from "@/components/kerja/kirim-ringkasan-form";
import { getProject, listNotes, listTasks } from "@/lib/workspace-sheets";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const proyek = await getProject(id);
  return { title: proyek?.judul ?? "Proyek" };
}

export default async function ProyekDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proyek = await getProject(id);
  if (!proyek) notFound();

  const [tugas, catatan] = await Promise.all([listTasks(id), listNotes(id)]);

  return (
    <div className="flex flex-col gap-10">
      <ProyekHeader proyek={proyek} />
      <KirimRingkasanForm proyekId={id} />

      <section>
        <h2 className="eyebrow mb-4">Papan tugas</h2>
        <PapanTugas proyekId={id} tugasAwal={tugas} />
      </section>

      <section>
        <CatatanPanel proyekId={id} catatan={catatan} />
      </section>
    </div>
  );
}
