/**
 * Perhitungan murni untuk halaman Ultraproduktif 2.0 (brief harian).
 *
 * Semua tanggal berupa teks "YYYY-MM-DD[THH:mm]" dalam WIB — lihat
 * `workspace-utils.ts` untuk alasan kenapa tidak lewat `Date` lokal server.
 */
import type { WorkProject, WorkSchedule, WorkTask } from "@/lib/workspace-types";
import { tanggalKey } from "@/lib/workspace-utils";

const MS_HARI = 24 * 60 * 60 * 1000;

function utcMs(tanggal: string): number {
  const [y, m, d] = tanggal.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Selisih hari kalender `ke - dari` (positif = di masa depan). */
export function selisihHari(dari: string, ke: string): number {
  return Math.round((utcMs(ke) - utcMs(dari)) / MS_HARI);
}

/** "H-3", "Hari ini", "Besok", "Telat 2 hari". */
export function labelHitungMundur(selisih: number): string {
  if (selisih === 0) return "Hari ini";
  if (selisih === 1) return "Besok";
  if (selisih > 1) return `H-${selisih}`;
  return `Telat ${Math.abs(selisih)} hari`;
}

export function tambahHari(tanggal: string, n: number): string {
  const d = new Date(utcMs(tanggal) + n * MS_HARI);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** Senin dari pekan yang memuat `tanggal` (pekan Indonesia mulai Senin). */
export function awalPekan(tanggal: string): string {
  const hari = new Date(utcMs(tanggal)).getUTCDay(); // 0 = Minggu
  return tambahHari(tanggal, -((hari + 6) % 7));
}

export interface TugasBrief extends WorkTask {
  tanggal: string; // tenggat tanpa jam
  selisih: number; // hari dari hari ini
  proyekJudul: string;
}

export interface StatProyek {
  proyek: WorkProject;
  total: number;
  selesai: number;
  berikutnya: TugasBrief | null;
}

export interface BriefData {
  hariIni: string;
  hero: TugasBrief | null;
  terlambat: TugasBrief[];
  hariIniTugas: TugasBrief[];
  hariIniJadwal: WorkSchedule[];
  pekan: { label: string; mulai: string; tugas: TugasBrief[] }[];
  proyek: StatProyek[];
  hitung: { terbuka: number; selesai: number; terlambat: number; sepekan: number };
}

export function susunBrief(
  hariIni: string,
  proyek: WorkProject[],
  tugas: WorkTask[],
  jadwal: WorkSchedule[],
): BriefData {
  const judul = new Map(proyek.map((p) => [p.id, p.judul] as const));
  const aktifIds = new Set(proyek.filter((p) => p.status === "aktif").map((p) => p.id));

  const berTenggat: TugasBrief[] = tugas
    .filter((t) => t.tenggat && aktifIds.has(t.proyekId))
    .map((t) => ({
      ...t,
      tanggal: tanggalKey(t.tenggat as string),
      selisih: selisihHari(hariIni, tanggalKey(t.tenggat as string)),
      proyekJudul: judul.get(t.proyekId) ?? "",
    }))
    .sort((a, b) => (a.tenggat as string).localeCompare(b.tenggat as string));

  const terbuka = berTenggat.filter((t) => t.status !== "done");
  const terlambat = terbuka.filter((t) => t.selisih < 0);
  const mendatang = terbuka.filter((t) => t.selisih >= 0);

  // Hero: tenggat berprioritas tinggi terdekat; kalau tak ada, tenggat terdekat apa pun.
  const hero = mendatang.find((t) => t.prioritas === "tinggi") ?? mendatang[0] ?? null;

  const hariIniTugas = mendatang.filter((t) => t.selisih === 0);
  const hariIniJadwal = jadwal
    .filter((j) => tanggalKey(j.mulai) === hariIni)
    .sort((a, b) => a.mulai.localeCompare(b.mulai));

  // Kelompok per pekan, 5 pekan ke depan dari pekan ini.
  const pekanIni = awalPekan(hariIni);
  const pekan = Array.from({ length: 5 }, (_, i) => {
    const mulai = tambahHari(pekanIni, i * 7);
    const akhir = tambahHari(mulai, 6);
    return {
      label: i === 0 ? "Pekan ini" : i === 1 ? "Pekan depan" : `+${i} pekan`,
      mulai,
      tugas: mendatang.filter((t) => t.tanggal >= mulai && t.tanggal <= akhir),
    };
  });

  const stat: StatProyek[] = proyek
    .filter((p) => p.status === "aktif")
    .map((p) => {
      const milik = tugas.filter((t) => t.proyekId === p.id);
      const berikutnya = mendatang.find((t) => t.proyekId === p.id) ?? terlambat.find((t) => t.proyekId === p.id) ?? null;
      return {
        proyek: p,
        total: milik.length,
        selesai: milik.filter((t) => t.status === "done").length,
        berikutnya,
      };
    })
    // Proyek dengan tenggat terdekat naik ke atas; yang tak punya tenggat di bawah.
    .sort((a, b) => (a.berikutnya?.tenggat ?? "9999").localeCompare(b.berikutnya?.tenggat ?? "9999"));

  return {
    hariIni,
    hero,
    terlambat,
    hariIniTugas,
    hariIniJadwal,
    pekan,
    proyek: stat,
    hitung: {
      terbuka: terbuka.length,
      selesai: tugas.filter((t) => t.status === "done" && aktifIds.has(t.proyekId)).length,
      terlambat: terlambat.length,
      sepekan: mendatang.filter((t) => t.selisih <= 7).length,
    },
  };
}
