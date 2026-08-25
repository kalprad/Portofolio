import "server-only";
import { randomUUID } from "node:crypto";
import {
  angkaKe,
  bacaTabel,
  boolKe,
  perbaruiBaris,
  petakanBaris,
  tambahBaris,
  teksKe,
  workspaceSheetsConfigured,
  workspaceSheetUrl,
  type BarisMentah,
} from "@/lib/sheets-db";
import type {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  WorkNote,
  WorkProject,
  WorkSchedule,
  WorkTask,
} from "@/lib/workspace-types";

export { workspaceSheetsConfigured, workspaceSheetUrl };

/**
 * CRUD area Kerja di atas Google Sheets — satu tab per jenis data. Header
 * baris pertama tiap tab HARUS persis seperti daftar `*_KOLOM` di bawah; itu
 * yang ditampilkan sebagai petunjuk setup di /ultraproduktif saat spreadsheet
 * belum disiapkan.
 */

export const PROYEK_KOLOM = ["id", "judul", "deskripsi", "status", "warna", "dibuat_pada", "diubah_pada", "dihapus"];
export const TUGAS_KOLOM = ["id", "proyek_id", "judul", "deskripsi", "status", "prioritas", "tenggat", "urutan", "calendar_event_id", "calendar_diubah_pada", "dibuat_pada", "diubah_pada", "dihapus"];
export const CATATAN_KOLOM = [
  "id", "proyek_id", "judul", "isi", "dibuat_pada", "diubah_pada", "dihapus",
  // Kolom lampiran ditambah di ujung — `petakanBaris` memetakan by posisi,
  // jadi baris lama yang belum punya nilai di sini tetap aman kebaca kosong.
  "berkas_drive_id", "berkas_nama", "berkas_mime", "berkas_ukuran",
];
export const JADWAL_KOLOM = ["id", "proyek_id", "judul", "deskripsi", "mulai", "selesai", "lokasi", "calendar_event_id", "calendar_diubah_pada", "dibuat_pada", "diubah_pada", "dihapus"];
export const SINKRON_KOLOM = ["kunci", "nilai"];

const TAB = {
  proyek: "Proyek",
  tugas: "Tugas",
  catatan: "Catatan",
  jadwal: "Jadwal",
  sinkron: "Sinkron",
};

function sekarang(): string {
  return new Date().toISOString();
}

// --- Proyek --------------------------------------------------------------------

function bariskeProyek(b: BarisMentah): WorkProject {
  const p = petakanBaris(PROYEK_KOLOM, b.nilai);
  return {
    id: p.id,
    judul: p.judul,
    deskripsi: teksKe(p.deskripsi),
    status: (teksKe(p.status) ?? "aktif") as ProjectStatus,
    warna: teksKe(p.warna),
    dibuatPada: p.dibuat_pada,
    diubahPada: p.diubah_pada,
  };
}

function proyekKeBaris(p: WorkProject, dihapus = false): string[] {
  return [p.id, p.judul, p.deskripsi ?? "", p.status, p.warna ?? "", p.dibuatPada, p.diubahPada, dihapus ? "TRUE" : ""];
}

export async function listProjects(): Promise<WorkProject[]> {
  const baris = await bacaTabel(TAB.proyek, PROYEK_KOLOM);
  return baris
    .filter((b) => !boolKe(petakanBaris(PROYEK_KOLOM, b.nilai).dihapus))
    .map(bariskeProyek)
    .sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada));
}

export async function getProject(id: string): Promise<WorkProject | null> {
  return (await listProjects()).find((p) => p.id === id) ?? null;
}

export async function createProject(input: {
  judul: string;
  deskripsi?: string | null;
  status?: ProjectStatus;
  warna?: string | null;
}): Promise<WorkProject> {
  const waktu = sekarang();
  const proyek: WorkProject = {
    id: randomUUID(),
    judul: input.judul,
    deskripsi: input.deskripsi ?? null,
    status: input.status ?? "aktif",
    warna: input.warna ?? null,
    dibuatPada: waktu,
    diubahPada: waktu,
  };
  await tambahBaris(TAB.proyek, PROYEK_KOLOM, proyekKeBaris(proyek));
  return proyek;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<WorkProject, "judul" | "deskripsi" | "status" | "warna">>,
): Promise<WorkProject | null> {
  const baris = await bacaTabel(TAB.proyek, PROYEK_KOLOM);
  const target = baris.find((b) => petakanBaris(PROYEK_KOLOM, b.nilai).id === id);
  if (!target) return null;

  const proyek = { ...bariskeProyek(target), ...patch, diubahPada: sekarang() };
  await perbaruiBaris(TAB.proyek, PROYEK_KOLOM, target.baris, proyekKeBaris(proyek));
  return proyek;
}

export async function deleteProject(id: string): Promise<void> {
  const baris = await bacaTabel(TAB.proyek, PROYEK_KOLOM);
  const target = baris.find((b) => petakanBaris(PROYEK_KOLOM, b.nilai).id === id);
  if (!target) return;
  const proyek = bariskeProyek(target);
  await perbaruiBaris(TAB.proyek, PROYEK_KOLOM, target.baris, proyekKeBaris(proyek, true));
}

// --- Tugas ---------------------------------------------------------------------

function barisKeTugas(b: BarisMentah): WorkTask {
  const t = petakanBaris(TUGAS_KOLOM, b.nilai);
  return {
    id: t.id,
    proyekId: t.proyek_id,
    judul: t.judul,
    deskripsi: teksKe(t.deskripsi),
    status: (teksKe(t.status) ?? "backlog") as TaskStatus,
    prioritas: (teksKe(t.prioritas) ?? "sedang") as TaskPriority,
    tenggat: teksKe(t.tenggat),
    urutan: angkaKe(t.urutan),
    calendarEventId: teksKe(t.calendar_event_id),
    calendarDiubahPada: teksKe(t.calendar_diubah_pada),
    dibuatPada: t.dibuat_pada,
    diubahPada: t.diubah_pada,
  };
}

function tugasKeBaris(t: WorkTask, dihapus = false): string[] {
  return [
    t.id, t.proyekId, t.judul, t.deskripsi ?? "", t.status, t.prioritas,
    t.tenggat ?? "", String(t.urutan), t.calendarEventId ?? "", t.calendarDiubahPada ?? "",
    t.dibuatPada, t.diubahPada, dihapus ? "TRUE" : "",
  ];
}

async function semuaTugasMentah(): Promise<{ baris: BarisMentah; tugas: WorkTask }[]> {
  const baris = await bacaTabel(TAB.tugas, TUGAS_KOLOM);
  return baris
    .filter((b) => !boolKe(petakanBaris(TUGAS_KOLOM, b.nilai).dihapus))
    .map((b) => ({ baris: b, tugas: barisKeTugas(b) }));
}

export async function listTasks(proyekId?: string): Promise<WorkTask[]> {
  const semua = (await semuaTugasMentah()).map((x) => x.tugas);
  const hasil = proyekId ? semua.filter((t) => t.proyekId === proyekId) : semua;
  return hasil.sort((a, b) => a.urutan - b.urutan);
}

export async function getTask(id: string): Promise<WorkTask | null> {
  return (await semuaTugasMentah()).find((x) => x.tugas.id === id)?.tugas ?? null;
}

export async function createTask(input: {
  proyekId: string;
  judul: string;
  deskripsi?: string | null;
  status?: TaskStatus;
  prioritas?: TaskPriority;
  tenggat?: string | null;
}): Promise<WorkTask> {
  const status = input.status ?? "backlog";
  const sekolom = await listTasks(input.proyekId);
  const urutan = Math.max(0, ...sekolom.filter((t) => t.status === status).map((t) => t.urutan)) + 1;

  const waktu = sekarang();
  const tugas: WorkTask = {
    id: randomUUID(),
    proyekId: input.proyekId,
    judul: input.judul,
    deskripsi: input.deskripsi ?? null,
    status,
    prioritas: input.prioritas ?? "sedang",
    tenggat: input.tenggat ?? null,
    urutan,
    calendarEventId: null,
    calendarDiubahPada: null,
    dibuatPada: waktu,
    diubahPada: waktu,
  };
  await tambahBaris(TAB.tugas, TUGAS_KOLOM, tugasKeBaris(tugas));
  return tugas;
}

export async function updateTask(
  id: string,
  patch: Partial<Omit<WorkTask, "id" | "proyekId" | "dibuatPada">>,
): Promise<WorkTask | null> {
  const semua = await semuaTugasMentah();
  const target = semua.find((x) => x.tugas.id === id);
  if (!target) return null;

  const tugas: WorkTask = { ...target.tugas, ...patch, diubahPada: sekarang() };
  await perbaruiBaris(TAB.tugas, TUGAS_KOLOM, target.baris.baris, tugasKeBaris(tugas));
  return tugas;
}

export async function deleteTask(id: string): Promise<WorkTask | null> {
  const semua = await semuaTugasMentah();
  const target = semua.find((x) => x.tugas.id === id);
  if (!target) return null;
  await perbaruiBaris(TAB.tugas, TUGAS_KOLOM, target.baris.baris, tugasKeBaris(target.tugas, true));
  return target.tugas;
}

// --- Catatan ---------------------------------------------------------------------

function barisKeCatatan(b: BarisMentah): WorkNote {
  const c = petakanBaris(CATATAN_KOLOM, b.nilai);
  return {
    id: c.id,
    proyekId: c.proyek_id,
    judul: c.judul,
    isi: c.isi ?? "",
    berkasDriveId: teksKe(c.berkas_drive_id),
    berkasNama: teksKe(c.berkas_nama),
    berkasMime: teksKe(c.berkas_mime),
    berkasUkuran: c.berkas_ukuran ? angkaKe(c.berkas_ukuran, 0) || null : null,
    dibuatPada: c.dibuat_pada,
    diubahPada: c.diubah_pada,
  };
}

function catatanKeBaris(c: WorkNote, dihapus = false): string[] {
  return [
    c.id, c.proyekId, c.judul, c.isi, c.dibuatPada, c.diubahPada, dihapus ? "TRUE" : "",
    c.berkasDriveId ?? "", c.berkasNama ?? "", c.berkasMime ?? "", c.berkasUkuran ? String(c.berkasUkuran) : "",
  ];
}

async function semuaCatatanMentah(): Promise<{ baris: BarisMentah; catatan: WorkNote }[]> {
  const baris = await bacaTabel(TAB.catatan, CATATAN_KOLOM);
  return baris
    .filter((b) => !boolKe(petakanBaris(CATATAN_KOLOM, b.nilai).dihapus))
    .map((b) => ({ baris: b, catatan: barisKeCatatan(b) }));
}

export async function listNotes(proyekId: string): Promise<WorkNote[]> {
  return (await semuaCatatanMentah())
    .map((x) => x.catatan)
    .filter((c) => c.proyekId === proyekId)
    .sort((a, b) => b.diubahPada.localeCompare(a.diubahPada));
}

export async function createNote(input: {
  proyekId: string;
  judul: string;
  isi?: string;
  berkasDriveId?: string | null;
  berkasNama?: string | null;
  berkasMime?: string | null;
  berkasUkuran?: number | null;
}): Promise<WorkNote> {
  const waktu = sekarang();
  const catatan: WorkNote = {
    id: randomUUID(),
    proyekId: input.proyekId,
    judul: input.judul,
    isi: input.isi ?? "",
    berkasDriveId: input.berkasDriveId ?? null,
    berkasNama: input.berkasNama ?? null,
    berkasMime: input.berkasMime ?? null,
    berkasUkuran: input.berkasUkuran ?? null,
    dibuatPada: waktu,
    diubahPada: waktu,
  };
  await tambahBaris(TAB.catatan, CATATAN_KOLOM, catatanKeBaris(catatan));
  return catatan;
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<WorkNote, "judul" | "isi">>,
): Promise<WorkNote | null> {
  const semua = await semuaCatatanMentah();
  const target = semua.find((x) => x.catatan.id === id);
  if (!target) return null;

  const catatan: WorkNote = { ...target.catatan, ...patch, diubahPada: sekarang() };
  await perbaruiBaris(TAB.catatan, CATATAN_KOLOM, target.baris.baris, catatanKeBaris(catatan));
  return catatan;
}

export async function deleteNote(id: string): Promise<void> {
  const semua = await semuaCatatanMentah();
  const target = semua.find((x) => x.catatan.id === id);
  if (!target) return;
  await perbaruiBaris(TAB.catatan, CATATAN_KOLOM, target.baris.baris, catatanKeBaris(target.catatan, true));
}

// --- Jadwal ---------------------------------------------------------------------

function barisKeJadwal(b: BarisMentah): WorkSchedule {
  const j = petakanBaris(JADWAL_KOLOM, b.nilai);
  return {
    id: j.id,
    proyekId: teksKe(j.proyek_id),
    judul: j.judul,
    deskripsi: teksKe(j.deskripsi),
    mulai: j.mulai,
    selesai: teksKe(j.selesai),
    lokasi: teksKe(j.lokasi),
    calendarEventId: teksKe(j.calendar_event_id),
    calendarDiubahPada: teksKe(j.calendar_diubah_pada),
    dibuatPada: j.dibuat_pada,
    diubahPada: j.diubah_pada,
  };
}

function jadwalKeBaris(j: WorkSchedule, dihapus = false): string[] {
  return [
    j.id, j.proyekId ?? "", j.judul, j.deskripsi ?? "", j.mulai, j.selesai ?? "", j.lokasi ?? "",
    j.calendarEventId ?? "", j.calendarDiubahPada ?? "", j.dibuatPada, j.diubahPada, dihapus ? "TRUE" : "",
  ];
}

async function semuaJadwalMentah(): Promise<{ baris: BarisMentah; jadwal: WorkSchedule }[]> {
  const baris = await bacaTabel(TAB.jadwal, JADWAL_KOLOM);
  return baris
    .filter((b) => !boolKe(petakanBaris(JADWAL_KOLOM, b.nilai).dihapus))
    .map((b) => ({ baris: b, jadwal: barisKeJadwal(b) }));
}

export async function listSchedule(): Promise<WorkSchedule[]> {
  return (await semuaJadwalMentah()).map((x) => x.jadwal).sort((a, b) => a.mulai.localeCompare(b.mulai));
}

export async function getScheduleItem(id: string): Promise<WorkSchedule | null> {
  return (await semuaJadwalMentah()).find((x) => x.jadwal.id === id)?.jadwal ?? null;
}

export async function findScheduleByCalendarEvent(eventId: string): Promise<WorkSchedule | null> {
  return (await semuaJadwalMentah()).find((x) => x.jadwal.calendarEventId === eventId)?.jadwal ?? null;
}

export async function createSchedule(input: {
  proyekId?: string | null;
  judul: string;
  deskripsi?: string | null;
  mulai: string;
  selesai?: string | null;
  lokasi?: string | null;
}): Promise<WorkSchedule> {
  const waktu = sekarang();
  const jadwal: WorkSchedule = {
    id: randomUUID(),
    proyekId: input.proyekId ?? null,
    judul: input.judul,
    deskripsi: input.deskripsi ?? null,
    mulai: input.mulai,
    selesai: input.selesai ?? null,
    lokasi: input.lokasi ?? null,
    calendarEventId: null,
    calendarDiubahPada: null,
    dibuatPada: waktu,
    diubahPada: waktu,
  };
  await tambahBaris(TAB.jadwal, JADWAL_KOLOM, jadwalKeBaris(jadwal));
  return jadwal;
}

export async function updateSchedule(
  id: string,
  patch: Partial<Omit<WorkSchedule, "id" | "dibuatPada">>,
): Promise<WorkSchedule | null> {
  const semua = await semuaJadwalMentah();
  const target = semua.find((x) => x.jadwal.id === id);
  if (!target) return null;

  const jadwal: WorkSchedule = { ...target.jadwal, ...patch, diubahPada: sekarang() };
  await perbaruiBaris(TAB.jadwal, JADWAL_KOLOM, target.baris.baris, jadwalKeBaris(jadwal));
  return jadwal;
}

export async function deleteSchedule(id: string): Promise<WorkSchedule | null> {
  const semua = await semuaJadwalMentah();
  const target = semua.find((x) => x.jadwal.id === id);
  if (!target) return null;
  await perbaruiBaris(TAB.jadwal, JADWAL_KOLOM, target.baris.baris, jadwalKeBaris(target.jadwal, true));
  return target.jadwal;
}

// --- Sinkron (status token sinkronisasi Calendar, disimpan kunci/nilai) --------

async function bacaKunciSinkron(kunci: string): Promise<{ baris: number; nilai: string } | null> {
  const baris = await bacaTabel(TAB.sinkron, SINKRON_KOLOM);
  for (const b of baris) {
    const p = petakanBaris(SINKRON_KOLOM, b.nilai);
    if (p.kunci === kunci) return { baris: b.baris, nilai: p.nilai };
  }
  return null;
}

async function tulisKunciSinkron(kunci: string, nilai: string): Promise<void> {
  const ada = await bacaKunciSinkron(kunci);
  if (ada) {
    await perbaruiBaris(TAB.sinkron, SINKRON_KOLOM, ada.baris, [kunci, nilai]);
  } else {
    await tambahBaris(TAB.sinkron, SINKRON_KOLOM, [kunci, nilai]);
  }
}

export async function getSyncToken(): Promise<string | null> {
  return (await bacaKunciSinkron("next_sync_token"))?.nilai || null;
}

export async function setSyncToken(token: string): Promise<void> {
  await tulisKunciSinkron("next_sync_token", token);
  await tulisKunciSinkron("terakhir_sinkron_pada", sekarang());
}

export async function clearSyncToken(): Promise<void> {
  await tulisKunciSinkron("next_sync_token", "");
}

export async function getLastSyncedAt(): Promise<string | null> {
  return (await bacaKunciSinkron("terakhir_sinkron_pada"))?.nilai || null;
}
