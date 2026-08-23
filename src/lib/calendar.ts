import "server-only";
import { googleHeaders, serviceAccountConfigured } from "@/lib/google";

/**
 * Sinkron dua arah dengan satu Google Calendar, lewat service account yang
 * sama dengan Drive & Sheets.
 *
 * Service account tidak bisa membuka kalender pribadi siapa pun begitu saja —
 * kalender tujuan (baru atau yang sudah ada) harus dibagikan ke alamat service
 * account dengan izin "Buat perubahan pada acara". Setelah itu ID kalendernya
 * (bukan "primary") diisi ke `GOOGLE_CALENDAR_ID`.
 *
 * Setiap acara yang situs buat dititipi `extendedProperties.private.kerjaId` —
 * penanda balik ke baris Sheets asalnya. Itu yang dipakai proses sinkron masuk
 * (`/api/cron/sinkron-kalender`) untuk mencocokkan acara dengan barisnya, dan
 * untuk membedakan acara buatan situs dari acara yang dibuat langsung di
 * Calendar (misalnya lewat HP).
 */

const CAL_API = "https://www.googleapis.com/calendar/v3";

export type CalendarKind = "tugas" | "jadwal";

export function calendarConfigured(): boolean {
  return Boolean(serviceAccountConfigured() && process.env.GOOGLE_CALENDAR_ID);
}

function calendarId(): string {
  const id = process.env.GOOGLE_CALENDAR_ID;
  if (!id) throw new Error("GOOGLE_CALENDAR_ID belum disetel.");
  return id;
}

function timeZone(): string {
  return process.env.GOOGLE_CALENDAR_TIMEZONE ?? "Asia/Jakarta";
}

async function panggil(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CAL_API}${path}`, {
    ...init,
    headers: {
      ...(await googleHeaders()),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

export interface CalendarEvent {
  id: string;
  status: "confirmed" | "cancelled" | "tentative";
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  updated?: string;
  extendedProperties?: { private?: Record<string, string> };
}

export interface EventInput {
  judul: string;
  deskripsi?: string | null;
  lokasi?: string | null;
  mulai: string;
  selesai: string;
  kerjaId: string;
  kerjaKind: CalendarKind;
}

function keBadanEvent(input: EventInput) {
  return {
    summary: input.judul,
    description: input.deskripsi ?? undefined,
    location: input.lokasi ?? undefined,
    start: { dateTime: input.mulai, timeZone: timeZone() },
    end: { dateTime: input.selesai, timeZone: timeZone() },
    extendedProperties: {
      private: { kerjaId: input.kerjaId, kerjaKind: input.kerjaKind },
    },
  };
}

/** Buat acara baru. Mengembalikan event Calendar-nya (berisi id & `updated`). */
export async function buatEvent(input: EventInput): Promise<CalendarEvent> {
  const res = await panggil(`/calendars/${encodeURIComponent(calendarId())}/events`, {
    method: "POST",
    body: JSON.stringify(keBadanEvent(input)),
  });
  if (!res.ok) {
    throw new Error(`Gagal membuat acara Calendar (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as CalendarEvent;
}

/** Timpa acara yang sudah ada. */
export async function perbaruiEvent(eventId: string, input: EventInput): Promise<CalendarEvent> {
  const res = await panggil(
    `/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    { method: "PATCH", body: JSON.stringify(keBadanEvent(input)) },
  );
  if (!res.ok) {
    throw new Error(`Gagal memperbarui acara Calendar (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as CalendarEvent;
}

/** Hapus acara. Acara yang sudah tidak ada dianggap sukses (bukan galat). */
export async function hapusEvent(eventId: string): Promise<void> {
  const res = await panggil(
    `/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Gagal menghapus acara Calendar (${res.status}): ${await res.text()}`);
  }
}

export interface HasilDaftarEvent {
  items: CalendarEvent[];
  /** Ada halaman lanjutan yang perlu diambil sebelum token sinkron baru sah dipakai. */
  nextPageToken: string | null;
  /** Simpan ini untuk panggilan sinkron berikutnya. Hanya muncul di halaman terakhir. */
  nextSyncToken: string | null;
  /** True kalau `syncToken` yang dipakai sudah kedaluwarsa — pemanggil harus sinkron penuh ulang. */
  kedaluwarsa: boolean;
}

/**
 * Ambil acara yang berubah sejak `syncToken` (sinkron tambahan), atau semua
 * acara sejak `timeMinIso` kalau token kosong/kedaluwarsa (sinkron penuh).
 */
export async function daftarEvent(opsi: {
  syncToken?: string | null;
  pageToken?: string | null;
  timeMinIso?: string;
}): Promise<HasilDaftarEvent> {
  const url = new URL(`${CAL_API}/calendars/${encodeURIComponent(calendarId())}/events`);
  url.searchParams.set("showDeleted", "true");
  url.searchParams.set("maxResults", "250");
  if (opsi.pageToken) {
    url.searchParams.set("pageToken", opsi.pageToken);
  } else if (opsi.syncToken) {
    url.searchParams.set("syncToken", opsi.syncToken);
  } else if (opsi.timeMinIso) {
    url.searchParams.set("timeMin", opsi.timeMinIso);
    url.searchParams.set("singleEvents", "true");
  }

  const res = await fetch(url, { headers: await googleHeaders(), cache: "no-store" });

  if (res.status === 410) {
    return { items: [], nextPageToken: null, nextSyncToken: null, kedaluwarsa: true };
  }
  if (!res.ok) {
    throw new Error(`Gagal membaca acara Calendar (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as {
    items?: CalendarEvent[];
    nextPageToken?: string;
    nextSyncToken?: string;
  };

  return {
    items: data.items ?? [],
    nextPageToken: data.nextPageToken ?? null,
    nextSyncToken: data.nextSyncToken ?? null,
    kedaluwarsa: false,
  };
}
