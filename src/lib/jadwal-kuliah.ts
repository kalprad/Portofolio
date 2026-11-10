/**
 * Jadwal kuliah semester ini (S1 + S2 fast-track), ditanam langsung di kode —
 * tidak dibaca dari Google Calendar. Sumbernya berkas .ics jadwal KRS; tiap
 * mata kuliah berulang mingguan selama 16 pertemuan.
 *
 * Perubahan jadwal ditulis sebagai aturan baru, bukan dengan menimpa yang lama,
 * supaya hari-hari yang sudah lewat tetap tampil sesuai kenyataannya. Contoh:
 * MEHL dulu Senin 15.30, mulai 11 Nov pindah ke Rabu 13.00 di Ruang 235.
 */
import type { AcaraMasuk } from "@/lib/workspace-hari";

interface AturanKuliah {
  kunci: string;
  judul: string;
  /** Hari dalam sepekan, gaya JavaScript: 0 = Minggu, 1 = Senin, ... */
  hari: number;
  mulai: string; // "HH:mm"
  selesai: string; // "HH:mm"
  lokasi: string;
  /** Tanggal pertemuan pertama dan terakhir (inklusif), "YYYY-MM-DD". */
  dari: string;
  sampai: string;
  catatan?: string;
}

export const ATURAN_KULIAH: AturanKuliah[] = [
  { kunci: "etpi", judul: "Etika dan Teknik Penulisan Ilmiah (Kelas C)", hari: 1, mulai: "07:00", selesai: "09:30", lokasi: "Ruang Kelas 9B1 Lt.9", dari: "2026-08-03", sampai: "2026-11-16" },
  { kunci: "mekkon", judul: "Mekanika Kontinum (A-STR)", hari: 1, mulai: "10:00", selesai: "11:40", lokasi: "Ruang Kuliah 212", dari: "2026-08-03", sampai: "2026-11-16" },
  { kunci: "adsl", judul: "Analisis Dinamika Struktur Lanjut (A-STR)", hari: 1, mulai: "13:00", selesai: "15:30", lokasi: "Ruang Kelas 5.1", dari: "2026-08-03", sampai: "2026-11-16" },
  // MEHL: Senin sampai 9 Nov, lalu pindah ke Rabu 13.00 (Ruang 235) mulai 11 Nov (pertemuan 11-14, Prof. Bambang Supriyadi).
  { kunci: "mehl-senin", judul: "Metode Elemen Hingga Lanjut (A-STR)", hari: 1, mulai: "15:30", selesai: "17:10", lokasi: "Ruang Kelas 5.2", dari: "2026-08-03", sampai: "2026-11-09" },
  { kunci: "mehl-rabu", judul: "Metode Elemen Hingga Lanjut (A-STR)", hari: 3, mulai: "13:00", selesai: "14:40", lokasi: "Ruang 235", dari: "2026-11-11", sampai: "2026-11-18", catatan: "Jam selesai 14.40 perkiraan (100 menit)" },
  { kunci: "mnl", judul: "Metode Numerik Lanjut (A-STR)", hari: 2, mulai: "07:15", selesai: "09:45", lokasi: "Ruang Kelas C MSTT 214A", dari: "2026-08-04", sampai: "2026-11-17" },
  { kunci: "pis1", judul: "Perancangan Infrastruktur Sipil 1 (Kelas B)", hari: 4, mulai: "10:00", selesai: "11:40", lokasi: "Ruang Kuliah 211", dari: "2026-08-06", sampai: "2026-11-19" },
  { kunci: "statek", judul: "Statistika Teknik (A-STR)", hari: 4, mulai: "13:00", selesai: "15:30", lokasi: "Ruang Kelas 5.1", dari: "2026-08-06", sampai: "2026-11-19" },
];

function hariKe(tanggal: string): number {
  const [y, m, d] = tanggal.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Kuliah pada satu tanggal "YYYY-MM-DD", urut jam mulai. */
export function kuliahPadaTanggal(tanggal: string): AcaraMasuk[] {
  const hari = hariKe(tanggal);
  return ATURAN_KULIAH.filter((a) => a.hari === hari && tanggal >= a.dari && tanggal <= a.sampai)
    .sort((a, b) => a.mulai.localeCompare(b.mulai))
    .map((a) => ({
      id: `kuliah:${a.kunci}:${tanggal}`,
      kalender: "Kuliah",
      judul: a.judul,
      mulai: `${tanggal}T${a.mulai}`,
      selesai: `${tanggal}T${a.selesai}`,
      seharian: false,
      lokasi: a.lokasi,
    }));
}
