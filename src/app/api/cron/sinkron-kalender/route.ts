import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  calendarConfigured,
  daftarEvent,
  perbaruiEvent,
  type CalendarEvent,
} from "@/lib/calendar";
import * as ws from "@/lib/workspace-sheets";
import { dariISOkeWIB, keRFC3339, tambahMenit } from "@/lib/workspace-utils";

/**
 * Sisi "masuk" dari sinkron dua arah dengan Google Calendar.
 *
 * Sisi "keluar" (situs -> Calendar) terjadi seketika, langsung di server
 * action tiap kali tugas/jadwal disimpan (lihat `workspace-actions.ts`). Sisi
 * ini menangkap perubahan dari ARAH SEBALIKNYA — acara yang diedit atau
 * dibuat langsung di Calendar (misal dari HP) — lewat pengecekan berkala.
 *
 * Dipanggil oleh Vercel Cron (lihat `vercel.json`), dan boleh juga dipicu
 * manual selagi masuk sebagai admin (tombol "Sinkron sekarang" di /ultraproduktif).
 *
 * Aturan tabrakan: setiap acara yang situs buat dititipi cap waktu
 * `calendar_diubah_pada` dari respons Calendar. Kalau saat sinkron masuk cap
 * waktu itu sudah >= punya Calendar sekarang, berarti tidak ada perubahan
 * sungguhan dari luar sejak terakhir situs menulis — dilewati. Kalau lebih
 * baru, berarti memang diedit dari Calendar dan sheets mengalah, ditimpa.
 */

async function diizinkan(req: Request): Promise<boolean> {
  const rahasia = process.env.CRON_SECRET;
  if (rahasia && req.headers.get("authorization") === `Bearer ${rahasia}`) return true;
  return Boolean(await requireAdmin());
}

async function tarikSemuaEvent(syncToken: string | null): Promise<{
  items: CalendarEvent[];
  nextSyncToken: string | null;
  kedaluwarsa: boolean;
}> {
  const items: CalendarEvent[] = [];
  let pageToken: string | null = null;
  let nextSyncToken: string | null = null;

  do {
    const hasil = await daftarEvent({
      syncToken: pageToken ? null : syncToken,
      pageToken,
      timeMinIso: syncToken ? undefined : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (hasil.kedaluwarsa) return { items: [], nextSyncToken: null, kedaluwarsa: true };

    items.push(...hasil.items);
    pageToken = hasil.nextPageToken;
    if (hasil.nextSyncToken) nextSyncToken = hasil.nextSyncToken;
  } while (pageToken);

  return { items, nextSyncToken, kedaluwarsa: false };
}

interface Ringkasan {
  diproses: number;
  dibuat: number;
  diperbarui: number;
  dihapus: number;
}

async function prosesEvent(event: CalendarEvent, ringkasan: Ringkasan): Promise<void> {
  const priv = event.extendedProperties?.private;
  const kerjaId = priv?.kerjaId;
  const kerjaKind = priv?.kerjaKind as "tugas" | "jadwal" | undefined;

  if (event.status === "cancelled") {
    if (kerjaKind === "tugas" && kerjaId) {
      const tugas = await ws.getTask(kerjaId);
      if (tugas && tugas.calendarEventId === event.id) {
        await ws.updateTask(tugas.id, { tenggat: null, calendarEventId: null, calendarDiubahPada: null });
        ringkasan.diperbarui++;
      }
    } else if (kerjaKind === "jadwal" && kerjaId) {
      const jadwal = await ws.getScheduleItem(kerjaId);
      if (jadwal && jadwal.calendarEventId === event.id) {
        await ws.deleteSchedule(jadwal.id);
        ringkasan.dihapus++;
      }
    }
    return;
  }

  const updatedIso = event.updated ?? null;
  const mulaiWIB = event.start?.dateTime
    ? dariISOkeWIB(event.start.dateTime)
    : event.start?.date
      ? `${event.start.date}T00:00`
      : null;
  const selesaiWIB = event.end?.dateTime ? dariISOkeWIB(event.end.dateTime) : null;
  if (!mulaiWIB) return; // acara tanpa waktu jelas (jarang terjadi) dilewati saja

  if (kerjaKind === "tugas" && kerjaId) {
    const tugas = await ws.getTask(kerjaId);
    if (!tugas || tugas.calendarEventId !== event.id) return;
    if (tugas.calendarDiubahPada && updatedIso && tugas.calendarDiubahPada >= updatedIso) return;

    await ws.updateTask(tugas.id, {
      judul: event.summary?.replace(/^Tugas:\s*/, "") || tugas.judul,
      deskripsi: event.description ?? tugas.deskripsi,
      tenggat: mulaiWIB,
      calendarDiubahPada: updatedIso,
    });
    ringkasan.diperbarui++;
    return;
  }

  if (kerjaKind === "jadwal" && kerjaId) {
    const jadwal = await ws.getScheduleItem(kerjaId);
    if (!jadwal || jadwal.calendarEventId !== event.id) return;
    if (jadwal.calendarDiubahPada && updatedIso && jadwal.calendarDiubahPada >= updatedIso) return;

    await ws.updateSchedule(jadwal.id, {
      judul: event.summary || jadwal.judul,
      deskripsi: event.description ?? jadwal.deskripsi,
      lokasi: event.location ?? jadwal.lokasi,
      mulai: mulaiWIB,
      selesai: selesaiWIB,
      calendarDiubahPada: updatedIso,
    });
    ringkasan.diperbarui++;
    return;
  }

  // Acara tanpa penanda kerjaId — dibuat langsung di Calendar (mis. dari HP).
  // Sudah pernah ditandai di sinkron sebelumnya tapi belum ketemu? Cek dulu.
  const sudahAda = await ws.findScheduleByCalendarEvent(event.id);
  if (sudahAda) {
    if (sudahAda.calendarDiubahPada && updatedIso && sudahAda.calendarDiubahPada >= updatedIso) return;
    await ws.updateSchedule(sudahAda.id, {
      judul: event.summary || sudahAda.judul,
      deskripsi: event.description ?? sudahAda.deskripsi,
      lokasi: event.location ?? sudahAda.lokasi,
      mulai: mulaiWIB,
      selesai: selesaiWIB,
      calendarDiubahPada: updatedIso,
    });
    ringkasan.diperbarui++;
    return;
  }

  const baru = await ws.createSchedule({
    judul: event.summary || "(tanpa judul)",
    deskripsi: event.description ?? null,
    lokasi: event.location ?? null,
    mulai: mulaiWIB,
    selesai: selesaiWIB,
  });
  await ws.updateSchedule(baru.id, { calendarEventId: event.id, calendarDiubahPada: updatedIso });

  // Tandai balik di Calendar supaya sinkron berikutnya kenal acara ini.
  await perbaruiEvent(event.id, {
    judul: baru.judul,
    deskripsi: baru.deskripsi ?? undefined,
    lokasi: baru.lokasi ?? undefined,
    mulai: keRFC3339(baru.mulai),
    selesai: keRFC3339(baru.selesai ?? tambahMenit(baru.mulai, 60)),
    kerjaId: baru.id,
    kerjaKind: "jadwal",
  }).catch((err) => console.error("[kerja] gagal menandai balik acara Calendar:", err));

  ringkasan.dibuat++;
}

async function sinkronMasuk(): Promise<Ringkasan> {
  const ringkasan: Ringkasan = { diproses: 0, dibuat: 0, diperbarui: 0, dihapus: 0 };

  let syncToken = await ws.getSyncToken();
  let hasil = await tarikSemuaEvent(syncToken);

  if (hasil.kedaluwarsa) {
    // Token basi (mis. lebih dari beberapa minggu tidak sinkron) — ulang dari nol sekali.
    await ws.clearSyncToken();
    syncToken = null;
    hasil = await tarikSemuaEvent(null);
  }

  for (const event of hasil.items) {
    ringkasan.diproses++;
    await prosesEvent(event, ringkasan);
  }

  if (hasil.nextSyncToken) await ws.setSyncToken(hasil.nextSyncToken);

  return ringkasan;
}

export async function GET(req: Request) {
  if (!(await diizinkan(req))) {
    return NextResponse.json({ ok: false, message: "Tidak berwenang." }, { status: 401 });
  }

  if (!calendarConfigured() || !ws.workspaceSheetsConfigured()) {
    return NextResponse.json({
      ok: true,
      message: "Google Calendar atau Sheets Ultraproduktif belum disetel — tidak ada yang disinkron.",
    });
  }

  try {
    const ringkasan = await sinkronMasuk();
    revalidatePath("/ultraproduktif");
    revalidatePath("/ultraproduktif/jadwal");
    return NextResponse.json({ ok: true, ...ringkasan });
  } catch (err) {
    console.error("[kerja] sinkron masuk gagal:", err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Gagal sinkron." },
      { status: 500 },
    );
  }
}
