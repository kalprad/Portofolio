/**
 * Bantuan tanggal/jam khusus area Kerja.
 *
 * Semua waktu (tenggat tugas, mulai/selesai jadwal) disimpan sebagai teks
 * "YYYY-MM-DDTHH:mm" TANPA info zona — dianggap selalu WIB, karena ini
 * aplikasi pribadi satu pengguna satu zona waktu. Sengaja TIDAK memakai
 * `new Date(teks).toISOString()` seperti panel admin konten (lihat
 * `admin/actions.ts`), sebab itu menafsirkan teksnya sebagai jam di zona
 * SERVER (UTC di Vercel) — jam 10 pagi WIB bisa kesimpan sebagai jam 5 sore.
 * Fungsi di sini memecah teksnya sendiri lewat string, tidak pernah lewat
 * `Date` untuk pembacaan/penulisan nilai yang tersimpan.
 *
 * Pengecualian satu-satunya: `dariISOkeWIB`, dipakai saat menerima acara dari
 * Google Calendar (yang memberi waktu absolut sungguhan) — di situ konversi
 * zona yang benar justru wajib.
 */

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface BagianWaktu {
  tahun: number;
  bulan: number;
  tanggal: number;
  jam: number;
  menit: number;
}

function uraikan(waktuLokal: string): BagianWaktu {
  const [tgl, jam] = waktuLokal.split("T");
  const [tahun, bulan, tanggal] = tgl.split("-").map(Number);
  const [j, m] = (jam ?? "00:00").split(":").map(Number);
  return { tahun, bulan, tanggal, jam: j || 0, menit: m || 0 };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function keTeks(b: BagianWaktu): string {
  return `${b.tahun}-${pad(b.bulan)}-${pad(b.tanggal)}T${pad(b.jam)}:${pad(b.menit)}`;
}

/** Tambah/kurangi menit dari teks waktu lokal, menangani lewat tengah malam. */
export function tambahMenit(waktuLokal: string, menit: number): string {
  const b = uraikan(waktuLokal);
  const d = new Date(Date.UTC(b.tahun, b.bulan - 1, b.tanggal, b.jam, b.menit + menit));
  return keTeks({
    tahun: d.getUTCFullYear(),
    bulan: d.getUTCMonth() + 1,
    tanggal: d.getUTCDate(),
    jam: d.getUTCHours(),
    menit: d.getUTCMinutes(),
  });
}

/** "23 Agu 2026, 10.00" */
export function formatWaktuLokal(waktuLokal: string | null | undefined): string {
  if (!waktuLokal) return "";
  const b = uraikan(waktuLokal);
  return `${b.tanggal} ${BULAN_PENDEK[b.bulan - 1]} ${b.tahun}, ${pad(b.jam)}.${pad(b.menit)}`;
}

/** "Minggu, 23 Agu 2026" */
export function formatTanggalLokal(waktuLokal: string | null | undefined): string {
  if (!waktuLokal) return "";
  const b = uraikan(waktuLokal);
  const hari = new Date(Date.UTC(b.tahun, b.bulan - 1, b.tanggal)).getUTCDay();
  return `${HARI[hari]}, ${b.tanggal} ${BULAN_PENDEK[b.bulan - 1]} ${b.tahun}`;
}

/** Kunci "YYYY-MM-DD" — untuk mengelompokkan agenda per hari. */
export function tanggalKey(waktuLokal: string): string {
  return waktuLokal.slice(0, 10);
}

/** Teks tanggal lokal "sekarang" (WIB = UTC+7, tanpa jam biar bisa dibandingkan). */
export function hariIniWIB(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())}`;
}

/** Teks waktu lokal "sekarang", format sama seperti nilai tersimpan — untuk bandingkan lewat-tenggat. */
export function sekarangWIB(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return keTeks({
    tahun: wib.getUTCFullYear(),
    bulan: wib.getUTCMonth() + 1,
    tanggal: wib.getUTCDate(),
    jam: wib.getUTCHours(),
    menit: wib.getUTCMinutes(),
  });
}

export function sudahLewat(waktuLokal: string | null | undefined): boolean {
  if (!waktuLokal) return false;
  return waktuLokal < sekarangWIB();
}

/** Konversi waktu absolut ISO (dari Google Calendar) ke teks lokal WIB. Indonesia tidak pakai DST, jadi offset +7 aman di-hardcode. */
export function dariISOkeWIB(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 7 * 60 * 60 * 1000);
  return keTeks({
    tahun: d.getUTCFullYear(),
    bulan: d.getUTCMonth() + 1,
    tanggal: d.getUTCDate(),
    jam: d.getUTCHours(),
    menit: d.getUTCMinutes(),
  });
}

/** Waktu lokal WIB ("YYYY-MM-DDTHH:mm") -> dateTime RFC3339 untuk dikirim ke Calendar API. */
export function keRFC3339(waktuLokal: string): string {
  return `${waktuLokal}:00`;
}

/** Gabungkan tugas bertenggat + jadwal berdiri sendiri jadi satu linimasa terurut. */
export function buatAgenda(
  tugas: { id: string; judul: string; tenggat: string | null; proyekId: string }[],
  jadwal: { id: string; judul: string; mulai: string; proyekId: string | null }[],
  judulProyek: Map<string, string>,
): import("@/lib/workspace-types").AgendaEntry[] {
  const dariTugas = tugas
    .filter((t): t is typeof t & { tenggat: string } => Boolean(t.tenggat))
    .map((t) => ({
      kind: "tugas" as const,
      id: t.id,
      judul: t.judul,
      waktu: t.tenggat,
      proyekId: t.proyekId,
      proyekJudul: judulProyek.get(t.proyekId) ?? null,
    }));

  const dariJadwal = jadwal.map((j) => ({
    kind: "jadwal" as const,
    id: j.id,
    judul: j.judul,
    waktu: j.mulai,
    proyekId: j.proyekId,
    proyekJudul: j.proyekId ? (judulProyek.get(j.proyekId) ?? null) : null,
  }));

  return [...dariTugas, ...dariJadwal].sort((a, b) => a.waktu.localeCompare(b.waktu));
}
