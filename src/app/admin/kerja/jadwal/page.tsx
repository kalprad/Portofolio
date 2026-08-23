import type { Metadata } from "next";
import { AgendaList } from "@/components/kerja/agenda-list";
import { JadwalForm } from "@/components/kerja/jadwal-form";
import { listProjects, listSchedule, listTasks } from "@/lib/workspace-sheets";
import { buatAgenda } from "@/lib/workspace-utils";

export const metadata: Metadata = { title: "Jadwal" };

export default async function JadwalPage() {
  const [proyek, jadwal] = await Promise.all([listProjects(), listSchedule()]);
  const tugasSemua = (await Promise.all(proyek.map((p) => listTasks(p.id)))).flat();

  const judulProyek = new Map(proyek.map((p) => [p.id, p.judul] as const));
  const agenda = buatAgenda(tugasSemua, jadwal, judulProyek);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-lg">Jadwal</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Gabungan tugas bertenggat dan jadwal berdiri sendiri, dua arah dengan Google Calendar.
          </p>
        </div>
        <JadwalForm proyek={proyek} />
      </div>

      <AgendaList entri={agenda} />
    </div>
  );
}
