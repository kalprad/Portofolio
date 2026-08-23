"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { buatEvent, calendarConfigured, hapusEvent, perbaruiEvent } from "@/lib/calendar";
import { keRFC3339, tambahMenit } from "@/lib/workspace-utils";
import * as ws from "@/lib/workspace-sheets";
import type { ProjectStatus, TaskPriority, TaskStatus, WorkSchedule, WorkTask } from "@/lib/workspace-types";
import type { FormState } from "@/lib/form-state";

/**
 * Server action area Kerja.
 *
 * Setiap aksi memverifikasi `requireAdmin()` sendiri — sama seperti
 * `admin/actions.ts` — karena action bisa dipanggil langsung lewat HTTP,
 * middleware saja tidak cukup.
 *
 * Tugas & jadwal yang punya waktu otomatis didorong ke Google Calendar
 * (`GOOGLE_CALENDAR_ID`) setiap disimpan. Kalau Calendar belum disetel,
 * penyimpanan tetap jalan seperti biasa — sinkron cuma dilewati.
 */

async function pastikanAdmin(): Promise<void> {
  if (!(await requireAdmin())) throw new Error("Tidak berwenang. Masuk ulang dengan akun admin.");
}

const SHEETS_BELUM_SIAP: FormState = {
  ok: false,
  message: "Sheets area Kerja belum disetel. Isi GOOGLE_SHEETS_KERJA_ID di environment variable dulu.",
};

/** Dipakai action yang mengembalikan FormState — `/admin/kerja/proyek/baru` dan `/jadwal` tetap bisa dibuka lewat URL langsung walau Sheets belum disetel. */
function butuhSheets(): FormState | null {
  return ws.workspaceSheetsConfigured() ? null : SHEETS_BELUM_SIAP;
}

function refreshKerja(proyekId?: string | null) {
  revalidatePath("/admin/kerja");
  revalidatePath("/admin/kerja/jadwal");
  if (proyekId) revalidatePath(`/admin/kerja/proyek/${proyekId}`);
}

// --- Sinkron Calendar ------------------------------------------------------------

async function sinkronTugasKeCalendar(tugas: WorkTask): Promise<Partial<WorkTask>> {
  if (!calendarConfigured()) return {};

  if (!tugas.tenggat) {
    if (tugas.calendarEventId) {
      await hapusEvent(tugas.calendarEventId).catch((err) => console.error("[kerja] hapus event tugas gagal:", err));
      return { calendarEventId: null, calendarDiubahPada: null };
    }
    return {};
  }

  try {
    const input = {
      judul: `Tugas: ${tugas.judul}`,
      deskripsi: tugas.deskripsi,
      mulai: keRFC3339(tugas.tenggat),
      selesai: keRFC3339(tambahMenit(tugas.tenggat, 30)),
      kerjaId: tugas.id,
      kerjaKind: "tugas" as const,
    };
    const event = tugas.calendarEventId
      ? await perbaruiEvent(tugas.calendarEventId, input)
      : await buatEvent(input);
    return { calendarEventId: event.id, calendarDiubahPada: event.updated ?? null };
  } catch (err) {
    console.error("[kerja] sinkron tugas ke Calendar gagal:", err);
    return {};
  }
}

async function sinkronJadwalKeCalendar(jadwal: WorkSchedule): Promise<Partial<WorkSchedule>> {
  if (!calendarConfigured()) return {};

  try {
    const input = {
      judul: jadwal.judul,
      deskripsi: jadwal.deskripsi,
      lokasi: jadwal.lokasi,
      mulai: keRFC3339(jadwal.mulai),
      selesai: keRFC3339(jadwal.selesai ?? tambahMenit(jadwal.mulai, 60)),
      kerjaId: jadwal.id,
      kerjaKind: "jadwal" as const,
    };
    const event = jadwal.calendarEventId
      ? await perbaruiEvent(jadwal.calendarEventId, input)
      : await buatEvent(input);
    return { calendarEventId: event.id, calendarDiubahPada: event.updated ?? null };
  } catch (err) {
    console.error("[kerja] sinkron jadwal ke Calendar gagal:", err);
    return {};
  }
}

// --- Proyek ------------------------------------------------------------------

export async function buatProyek(_prev: FormState, formData: FormData): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul proyek wajib diisi." };

  const proyek = await ws.createProject({
    judul,
    deskripsi: String(formData.get("deskripsi") ?? "").trim() || null,
    warna: String(formData.get("warna") ?? "").trim() || null,
  });

  revalidatePath("/admin/kerja");
  redirect(`/admin/kerja/proyek/${proyek.id}`);
}

export async function perbaruiProyek(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul proyek wajib diisi." };

  await ws.updateProject(id, {
    judul,
    deskripsi: String(formData.get("deskripsi") ?? "").trim() || null,
    status: String(formData.get("status") ?? "aktif") as ProjectStatus,
    warna: String(formData.get("warna") ?? "").trim() || null,
  });

  refreshKerja(id);
  return { ok: true, message: "Tersimpan." };
}

export async function ubahStatusProyekAksi(id: string, status: ProjectStatus): Promise<void> {
  await pastikanAdmin();
  if (!ws.workspaceSheetsConfigured()) return;
  await ws.updateProject(id, { status });
  refreshKerja(id);
}

// --- Tugas ---------------------------------------------------------------------

export async function tambahTugasCepat(
  proyekId: string,
  status: TaskStatus,
  formData: FormData,
): Promise<void> {
  await pastikanAdmin();
  if (!ws.workspaceSheetsConfigured()) return;

  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return;

  await ws.createTask({ proyekId, judul, status });
  refreshKerja(proyekId);
}

export async function perbaruiTugas(
  id: string,
  proyekId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul tugas wajib diisi." };

  const tenggatMentah = String(formData.get("tenggat") ?? "").trim();

  const sebelum = await ws.getTask(id);
  if (!sebelum) return { ok: false, message: "Tugas tidak ditemukan." };

  const setelahDasar: WorkTask = {
    ...sebelum,
    judul,
    deskripsi: String(formData.get("deskripsi") ?? "").trim() || null,
    prioritas: String(formData.get("prioritas") ?? "sedang") as TaskPriority,
    tenggat: tenggatMentah || null,
  };

  const patchCalendar = await sinkronTugasKeCalendar(setelahDasar);
  await ws.updateTask(id, { ...setelahDasar, ...patchCalendar });

  refreshKerja(proyekId);
  return { ok: true, message: "Tersimpan." };
}

/** Dipanggil langsung (bukan lewat <form>) dari papan Kanban saat kartu digeser. */
export async function pindahkanTugas(
  id: string,
  proyekId: string,
  status: TaskStatus,
  urutan: number,
): Promise<void> {
  await pastikanAdmin();
  if (!ws.workspaceSheetsConfigured()) return;
  await ws.updateTask(id, { status, urutan });
  refreshKerja(proyekId);
}

export async function hapusTugasAksi(id: string, proyekId: string): Promise<void> {
  await pastikanAdmin();
  if (!ws.workspaceSheetsConfigured()) return;
  const tugas = await ws.deleteTask(id);
  if (tugas?.calendarEventId) {
    await hapusEvent(tugas.calendarEventId).catch((err) => console.error("[kerja] hapus event tugas gagal:", err));
  }
  refreshKerja(proyekId);
}

// --- Catatan ---------------------------------------------------------------------

export async function buatCatatan(
  proyekId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul catatan wajib diisi." };

  await ws.createNote({
    proyekId,
    judul,
    isi: String(formData.get("isi") ?? ""),
  });

  refreshKerja(proyekId);
  return { ok: true, message: "Catatan tersimpan." };
}

export async function perbaruiCatatan(
  id: string,
  proyekId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  if (!judul) return { ok: false, message: "Judul catatan wajib diisi." };

  await ws.updateNote(id, { judul, isi: String(formData.get("isi") ?? "") });

  refreshKerja(proyekId);
  return { ok: true, message: "Tersimpan." };
}

export async function hapusCatatanAksi(id: string, proyekId: string): Promise<void> {
  await pastikanAdmin();
  if (!ws.workspaceSheetsConfigured()) return;
  await ws.deleteNote(id);
  refreshKerja(proyekId);
}

// --- Jadwal ---------------------------------------------------------------------

export async function buatJadwal(_prev: FormState, formData: FormData): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  const mulai = String(formData.get("mulai") ?? "").trim();
  if (!judul || !mulai) return { ok: false, message: "Judul dan waktu mulai wajib diisi." };

  const proyekId = String(formData.get("proyek_id") ?? "").trim() || null;
  const selesaiMentah = String(formData.get("selesai") ?? "").trim() || null;

  const dasar = await ws.createSchedule({
    proyekId,
    judul,
    deskripsi: String(formData.get("deskripsi") ?? "").trim() || null,
    mulai,
    selesai: selesaiMentah,
    lokasi: String(formData.get("lokasi") ?? "").trim() || null,
  });

  const patchCalendar = await sinkronJadwalKeCalendar(dasar);
  if (Object.keys(patchCalendar).length > 0) {
    await ws.updateSchedule(dasar.id, patchCalendar);
  }

  refreshKerja(proyekId ?? undefined);
  return { ok: true, message: "Jadwal tersimpan." };
}

export async function perbaruiJadwal(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await pastikanAdmin();
  const belumSiap = butuhSheets();
  if (belumSiap) return belumSiap;

  const judul = String(formData.get("judul") ?? "").trim();
  const mulai = String(formData.get("mulai") ?? "").trim();
  if (!judul || !mulai) return { ok: false, message: "Judul dan waktu mulai wajib diisi." };

  const sebelum = await ws.getScheduleItem(id);
  if (!sebelum) return { ok: false, message: "Jadwal tidak ditemukan." };

  const setelahDasar: WorkSchedule = {
    ...sebelum,
    judul,
    deskripsi: String(formData.get("deskripsi") ?? "").trim() || null,
    mulai,
    selesai: String(formData.get("selesai") ?? "").trim() || null,
    lokasi: String(formData.get("lokasi") ?? "").trim() || null,
  };

  const patchCalendar = await sinkronJadwalKeCalendar(setelahDasar);
  await ws.updateSchedule(id, { ...setelahDasar, ...patchCalendar });

  refreshKerja(setelahDasar.proyekId ?? undefined);
  return { ok: true, message: "Tersimpan." };
}

export async function hapusJadwalAksi(id: string): Promise<void> {
  await pastikanAdmin();
  if (!ws.workspaceSheetsConfigured()) return;
  const jadwal = await ws.deleteSchedule(id);
  if (jadwal?.calendarEventId) {
    await hapusEvent(jadwal.calendarEventId).catch((err) => console.error("[kerja] hapus event jadwal gagal:", err));
  }
  refreshKerja(jadwal?.proyekId ?? undefined);
}
