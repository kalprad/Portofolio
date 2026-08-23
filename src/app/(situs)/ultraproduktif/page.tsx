import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, GitBranch as SheetIcon, Mail, Plus } from "lucide-react";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { AgendaList } from "@/components/kerja/agenda-list";
import { SinkronButton } from "@/components/kerja/sinkron-button";
import { listProjects, listSchedule, listTasks, workspaceSheetsConfigured, workspaceSheetUrl } from "@/lib/workspace-sheets";
import { calendarConfigured } from "@/lib/calendar";
import { emailConfigured } from "@/lib/email";
import { buatAgenda } from "@/lib/workspace-utils";
import { PROJECT_STATUS_LABEL } from "@/lib/workspace-types";

export const metadata: Metadata = { title: "Ringkasan" };

const TONE = { aktif: "success", selesai: "neutral", arsip: "warning" } as const;

export default async function KerjaRingkasanPage() {
  const sheetsSiap = workspaceSheetsConfigured();

  if (!sheetsSiap) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="display-lg">Ultraproduktif</h1>
        <EmptyState
          title="Belum disetel"
          description={
            'Ultraproduktif butuh spreadsheet Google Sheets sendiri sebagai penyimpan data (proyek, tugas, catatan, jadwal berubah terlalu sering untuk disimpan sebagai commit git). Buat satu spreadsheet baru, bagikan ke alamat service account yang sama dipakai Drive/Sheets sebagai Editor, lalu isi GOOGLE_SHEETS_KERJA_ID di environment variable.'
          }
        />
      </div>
    );
  }

  const proyek = await listProjects();
  const [jadwal, tugasSemua] = await Promise.all([
    listSchedule(),
    Promise.all(proyek.map((p) => listTasks(p.id))).then((r) => r.flat()),
  ]);

  const judulProyek = new Map(proyek.map((p) => [p.id, p.judul] as const));
  const agenda = buatAgenda(tugasSemua, jadwal, judulProyek).slice(0, 6);
  const kalenderSiap = calendarConfigured();
  const emailSiap = emailConfigured();
  const urlSheet = workspaceSheetUrl();

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-lg">Ultraproduktif</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Arsip proyek pribadi — tugas, catatan, dan jadwal jadi satu, dua arah dengan Google Calendar.
          </p>
        </div>
        <ButtonLink href="/ultraproduktif/proyek/baru">
          <Plus className="size-4" aria-hidden />
          Proyek baru
        </ButtonLink>
      </div>

      <section>
        <h2 className="eyebrow mb-4">Proyek</h2>
        {proyek.length === 0 ? (
          <EmptyState title="Belum ada proyek" description="Mulai dari satu proyek — tugas dan catatannya bisa ditambah sesudahnya." />
        ) : (
          <div className="grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {proyek.map((p) => (
              <Link key={p.id} href={`/ultraproduktif/proyek/${p.id}`} className="group bg-background p-5 transition-colors duration-200 hover:bg-muted">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-medium">{p.judul}</p>
                  <Badge tone={TONE[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
                </div>
                {p.deskripsi ? <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.deskripsi}</p> : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="eyebrow">Agenda terdekat</h2>
          <Link href="/ultraproduktif/jadwal" className="link-underline text-sm">Semua jadwal</Link>
        </div>
        <div className="mt-4">
          <AgendaList entri={agenda} />
        </div>
      </section>

      <section>
        <h2 className="eyebrow">Status integrasi</h2>
        <div className="mt-4 divide-y divide-border rounded border border-border bg-surface">
          <div className="flex items-start gap-4 p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <SheetIcon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Penyimpanan data Ultraproduktif</p>
                <Badge tone="success">Google Sheets</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Proyek, tugas, catatan, dan jadwal tersimpan di spreadsheet terpisah.{" "}
                {urlSheet ? (
                  <a href={urlSheet} target="_blank" rel="noopener noreferrer" className="link-underline text-accent">
                    Buka lembarnya
                  </a>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Google Calendar</p>
                <Badge tone={kalenderSiap ? "success" : "warning"}>{kalenderSiap ? "Tersambung, dua arah" : "Belum aktif"}</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {kalenderSiap ? (
                  <>
                    Tugas bertenggat & jadwal otomatis muncul di Calendar, dan edit dari Calendar (mis. lewat HP)
                    ikut masuk kembali setiap sinkron berkala berjalan.
                  </>
                ) : (
                  <>
                    Bagikan satu kalender Google ke alamat service account dengan izin &quot;Buat perubahan pada
                    acara&quot;, lalu isi <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GOOGLE_CALENDAR_ID</code>.
                  </>
                )}
              </p>
              {kalenderSiap ? (
                <div className="mt-3">
                  <SinkronButton />
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-4 p-5">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <Mail className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">Kirim ringkasan email</p>
                <Badge tone={emailSiap ? "success" : "warning"}>{emailSiap ? "Aktif" : "Belum aktif"}</Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {emailSiap ? (
                  <>Tombol &quot;Kirim ringkasan&quot; di tiap halaman proyek siap dipakai.</>
                ) : (
                  <>
                    Buat App Password di akun Gmail lo, lalu isi{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">EMAIL_SMTP_USER</code> dan{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">EMAIL_SMTP_PASSWORD</code>. Langkahnya
                    ada di README bagian 10.4.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
