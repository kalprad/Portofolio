/**
 * Perhitungan murni untuk tampilan jadwal per hari/per jam
 * (`/ultraproduktif/hari`). Tanpa akses jaringan: halaman mengumpulkan datanya
 * (Sheets + kalender baca-saja), fungsi di sini yang menyusunnya jadi blok
 * berkoordinat menit dan menentukan kolom saat ada acara yang saling tumpang.
 *
 * Semua waktu berupa teks lokal WIB "YYYY-MM-DDTHH:mm" — lihat
 * `workspace-utils.ts`. Menit dihitung dari awal hari (0..1440).
 */
import type { WorkProject, WorkSchedule, WorkTask } from "@/lib/workspace-types";

export const MENIT_HARI = 24 * 60;
/** Tinggi minimum sebuah blok (menit) supaya acara/tenggat pendek tetap terbaca. */
const MIN_DURASI = 30;
/** Durasi bawaan jadwal Sheets yang tidak punya jam selesai. */
const DURASI_BAWAAN = 60;
const JAM_AWAL_BAWAAN = 6;
const JAM_AKHIR_BAWAAN = 22;

export type JenisBlok = "kalender" | "jadwal" | "tugas";

/** Acara dari kalender baca-saja; bentuknya sama dengan `AcaraLuar` di `calendar.ts`. */
export interface AcaraMasuk {
  id: string;
  kalender: string;
  judul: string;
  mulai: string;
  selesai: string;
  seharian: boolean;
  lokasi: string | null;
}

export interface BlokHari {
  key: string;
  jenis: JenisBlok;
  judul: string;
  /** Menit dari 00:00 hari yang ditampilkan. */
  mulai: number;
  selesai: number;
  /** Teks jam yang ditampilkan, mis. "07.15–09.45" atau "10.00". */
  jam: string;
  lokasi: string | null;
  /** Proyek untuk jadwal/tugas, nama kalender untuk acara kalender. */
  ket: string | null;
  proyekId: string | null;
  warna: string;
  selesaiTugas: boolean;
  prioritasTinggi: boolean;
  /** Indeks kolom dan jumlah kolom pada gugus yang saling tumpang. */
  kolom: number;
  jumlahKolom: number;
}

export interface TanpaJam {
  key: string;
  jenis: JenisBlok;
  judul: string;
  ket: string | null;
  proyekId: string | null;
  warna: string;
  selesaiTugas: boolean;
}

export interface HariData {
  tanggal: string;
  blok: BlokHari[];
  tanpaJam: TanpaJam[];
  /** Rentang jam yang ditampilkan (jam bulat, akhir eksklusif). */
  jamAwal: number;
  jamAkhir: number;
  hitung: { acara: number; tenggat: number };
}

function menitDari(waktu: string): number {
  const jam = waktu.slice(11, 16);
  if (!jam) return 0;
  const [j, m] = jam.split(":").map(Number);
  return (j || 0) * 60 + (m || 0);
}

function jamTeks(menit: number): string {
  const m = Math.min(menit, MENIT_HARI);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}.${String(m % 60).padStart(2, "0")}`;
}

function rentangTeks(mulai: number, selesai: number, adaSelesai: boolean): string {
  return adaSelesai ? `${jamTeks(mulai)}–${jamTeks(selesai)}` : jamTeks(mulai);
}

/** Tanggal "YYYY-MM-DD" valid dan benar-benar ada di kalender (bukan 2026-02-31). */
export function tanggalValid(teks: string | undefined | null): teks is string {
  if (!teks || !/^\d{4}-\d{2}-\d{2}$/.test(teks)) return false;
  const [y, m, d] = teks.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Potong acara berinterval [mulaiWaktu, selesaiWaktu) ke hari `tanggal`; null kalau tidak beririsan. */
function potongKeHari(
  tanggal: string,
  mulaiWaktu: string,
  selesaiWaktu: string | null,
): { mulai: number; selesai: number; adaSelesai: boolean } | null {
  const tglMulai = mulaiWaktu.slice(0, 10);
  const tglSelesai = (selesaiWaktu ?? mulaiWaktu).slice(0, 10);
  if (tanggal < tglMulai || tanggal > tglSelesai) return null;

  const mulai = tglMulai < tanggal ? 0 : menitDari(mulaiWaktu);
  let selesai: number;
  let adaSelesai = Boolean(selesaiWaktu);
  if (!selesaiWaktu) {
    selesai = mulai + DURASI_BAWAAN;
  } else if (tglSelesai > tanggal) {
    selesai = MENIT_HARI;
  } else {
    selesai = menitDari(selesaiWaktu);
    // Jam selesai tidak sah (sebelum/sama dengan mulai) dianggap tidak diisi.
    if (selesai <= mulai) {
      selesai = mulai + DURASI_BAWAAN;
      adaSelesai = false;
    }
  }
  return { mulai, selesai: Math.min(selesai, MENIT_HARI), adaSelesai };
}

/**
 * Beri tiap blok nomor kolom. Blok yang saling tumpang membentuk satu gugus
 * dan berbagi lebar sama rata; gugus yang terpisah tidak saling mempersempit.
 */
export function tataKolom(blok: BlokHari[]): void {
  const urut = [...blok].sort((a, b) => a.mulai - b.mulai || b.selesai - a.selesai);
  let gugus: BlokHari[] = [];
  let akhirGugus = -1;

  const tutup = () => {
    const n = gugus.reduce((m, b) => Math.max(m, b.kolom + 1), 0);
    for (const b of gugus) b.jumlahKolom = n;
    gugus = [];
  };

  for (const b of urut) {
    // Panjang tampil minimum ikut dihitung, supaya blok pendek tidak menimpa yang berikutnya.
    const akhirTampil = Math.max(b.selesai, b.mulai + MIN_DURASI);
    if (gugus.length > 0 && b.mulai >= akhirGugus) tutup();

    const dipakai = new Set(
      gugus.filter((g) => Math.max(g.selesai, g.mulai + MIN_DURASI) > b.mulai).map((g) => g.kolom),
    );
    let k = 0;
    while (dipakai.has(k)) k++;
    b.kolom = k;
    gugus.push(b);
    akhirGugus = Math.max(akhirGugus, akhirTampil);
  }
  if (gugus.length > 0) tutup();
}

export function susunHari(input: {
  tanggal: string;
  proyek: WorkProject[];
  tugas: WorkTask[];
  jadwal: WorkSchedule[];
  acara: AcaraMasuk[];
  warnaProyek: (warna: string | null | undefined) => string;
  warnaKalender: string;
}): HariData {
  const { tanggal, proyek, tugas, jadwal, acara, warnaProyek, warnaKalender } = input;
  const infoProyek = new Map(proyek.map((p) => [p.id, p] as const));
  const aktif = new Set(proyek.filter((p) => p.status === "aktif").map((p) => p.id));

  const blok: BlokHari[] = [];
  const tanpaJam: TanpaJam[] = [];

  // 1. Acara kalender baca-saja (kuliah dsb.)
  for (const a of acara) {
    if (a.seharian) {
      // Tanggal akhir acara seharian bersifat eksklusif.
      if (tanggal >= a.mulai.slice(0, 10) && tanggal < a.selesai.slice(0, 10)) {
        tanpaJam.push({ key: `k:${a.id}`, jenis: "kalender", judul: a.judul, ket: a.kalender, proyekId: null, warna: warnaKalender, selesaiTugas: false });
      }
      continue;
    }
    const p = potongKeHari(tanggal, a.mulai, a.selesai);
    if (!p) continue;
    blok.push({
      key: `k:${a.id}`,
      jenis: "kalender",
      judul: a.judul,
      mulai: p.mulai,
      selesai: p.selesai,
      jam: rentangTeks(p.mulai, p.selesai, p.adaSelesai),
      lokasi: a.lokasi,
      ket: a.kalender,
      proyekId: null,
      warna: warnaKalender,
      selesaiTugas: false,
      prioritasTinggi: false,
      kolom: 0,
      jumlahKolom: 1,
    });
  }

  // 2. Jadwal dari Sheets
  for (const j of jadwal) {
    const p = potongKeHari(tanggal, j.mulai, j.selesai);
    if (!p) continue;
    const proj = j.proyekId ? infoProyek.get(j.proyekId) : undefined;
    blok.push({
      key: `j:${j.id}`,
      jenis: "jadwal",
      judul: j.judul,
      mulai: p.mulai,
      selesai: p.selesai,
      jam: rentangTeks(p.mulai, p.selesai, p.adaSelesai),
      lokasi: j.lokasi,
      ket: proj?.judul ?? null,
      proyekId: j.proyekId,
      warna: warnaProyek(proj?.warna),
      selesaiTugas: false,
      prioritasTinggi: false,
      kolom: 0,
      jumlahKolom: 1,
    });
  }

  // 3. Tenggat tugas pada hari itu (hanya proyek aktif)
  let tenggat = 0;
  for (const t of tugas) {
    if (!t.tenggat || !aktif.has(t.proyekId) || t.tenggat.slice(0, 10) !== tanggal) continue;
    tenggat++;
    const proj = infoProyek.get(t.proyekId);
    const warna = warnaProyek(proj?.warna);
    const selesaiTugas = t.status === "done";
    const jam = t.tenggat.slice(11, 16);
    if (!jam || jam === "00:00") {
      tanpaJam.push({ key: `t:${t.id}`, jenis: "tugas", judul: t.judul, ket: proj?.judul ?? null, proyekId: t.proyekId, warna, selesaiTugas });
      continue;
    }
    const m = menitDari(t.tenggat);
    blok.push({
      key: `t:${t.id}`,
      jenis: "tugas",
      judul: t.judul,
      mulai: m,
      selesai: Math.min(m + MIN_DURASI, MENIT_HARI),
      jam: jamTeks(m),
      lokasi: null,
      ket: proj?.judul ?? null,
      proyekId: t.proyekId,
      warna,
      selesaiTugas,
      prioritasTinggi: t.prioritas === "tinggi",
      kolom: 0,
      jumlahKolom: 1,
    });
  }

  blok.sort((a, b) => a.mulai - b.mulai || b.selesai - a.selesai);
  tataKolom(blok);

  // Rentang jam: bawaan 06–22, melebar bila ada yang di luarnya.
  let jamAwal = JAM_AWAL_BAWAAN;
  let jamAkhir = JAM_AKHIR_BAWAAN;
  for (const b of blok) {
    jamAwal = Math.min(jamAwal, Math.floor(b.mulai / 60));
    jamAkhir = Math.max(jamAkhir, Math.ceil(Math.max(b.selesai, b.mulai + MIN_DURASI) / 60));
  }
  jamAkhir = Math.min(jamAkhir, 24);

  return {
    tanggal,
    blok,
    tanpaJam,
    jamAwal,
    jamAkhir,
    hitung: { acara: blok.filter((b) => b.jenis !== "tugas").length + tanpaJam.filter((b) => b.jenis === "kalender").length, tenggat },
  };
}
