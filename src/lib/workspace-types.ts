/**
 * Bentuk data area Kerja — arsip proyek pribadi ala Notion.
 *
 * Berbeda dari `types.ts` (konten situs, hidup sebagai berkas di repositori),
 * data di sini hidup di Google Sheets lewat `workspace-sheets.ts` karena
 * berubah jauh lebih sering. Lihat catatan di `sheets-db.ts`.
 */

export type ProjectStatus = "aktif" | "selesai" | "arsip";
export type TaskStatus = "backlog" | "todo" | "doing" | "done";
export type TaskPriority = "rendah" | "sedang" | "tinggi";

export interface WorkProject {
  id: string;
  judul: string;
  deskripsi: string | null;
  status: ProjectStatus;
  warna: string | null;
  dibuatPada: string;
  diubahPada: string;
}

export interface WorkTask {
  id: string;
  proyekId: string;
  judul: string;
  deskripsi: string | null;
  status: TaskStatus;
  prioritas: TaskPriority;
  /** ISO datetime tenggat, atau null kalau tidak dijadwalkan. */
  tenggat: string | null;
  urutan: number;
  calendarEventId: string | null;
  /** Cap waktu `updated` terakhir dari Google Calendar — dipakai mendeteksi perubahan dari luar. */
  calendarDiubahPada: string | null;
  dibuatPada: string;
  diubahPada: string;
}

export interface WorkNote {
  id: string;
  proyekId: string;
  judul: string;
  isi: string;
  /** Lampiran opsional di Drive — semuanya null kalau catatan tidak punya berkas. */
  berkasDriveId: string | null;
  berkasNama: string | null;
  berkasMime: string | null;
  berkasUkuran: number | null;
  dibuatPada: string;
  diubahPada: string;
}

export interface WorkSchedule {
  id: string;
  /** Null kalau jadwal berdiri sendiri, tidak terikat proyek tertentu. */
  proyekId: string | null;
  judul: string;
  deskripsi: string | null;
  mulai: string;
  selesai: string | null;
  lokasi: string | null;
  calendarEventId: string | null;
  calendarDiubahPada: string | null;
  dibuatPada: string;
  diubahPada: string;
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  aktif: "Aktif",
  selesai: "Selesai",
  arsip: "Arsip",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  doing: "Dikerjakan",
  done: "Selesai",
};

export const TASK_STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "doing", "done"];

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  rendah: "Rendah",
  sedang: "Sedang",
  tinggi: "Tinggi",
};

/** Agenda gabungan: tugas bertenggat + jadwal berdiri sendiri, diurutkan satu linimasa. */
export interface AgendaEntry {
  kind: "tugas" | "jadwal";
  id: string;
  judul: string;
  waktu: string;
  proyekId: string | null;
  proyekJudul: string | null;
}
