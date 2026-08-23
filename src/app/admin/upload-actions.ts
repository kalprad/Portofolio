"use server";

import sharp from "sharp";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { simpanBerkas } from "@/lib/content-write";
import { slugify } from "@/lib/utils";

/**
 * Unggah foto dari panel admin.
 *
 * Alurnya: pengguna pilih berkas → dikompres di server (diperkecil ke maksimal
 * 1600px, diubah ke WebP) → langsung tersimpan sebagai berkas baru di
 * `public/foto/` (commit tersendiri di produksi, tulis langsung ke disk saat
 * pengembangan). Hasilnya berupa path seperti `/foto/nama-acak.webp`, yang
 * kemudian diisikan ke kolom URL foto terkait oleh komponen di sisi klien —
 * pengguna masih perlu menekan Simpan pada formulir utama supaya path itu
 * tertaut ke entitasnya (profil, proyek, atau tulisan).
 *
 * Batas ukuran diterapkan SEBELUM dikompres, bukan sesudah, supaya berkas
 * raksasa tidak membebani memori server saat diproses.
 */

const BATAS_UKURAN_MENTAH = 20 * 1024 * 1024; // 20 MB
const LEBAR_MAKS = 1600;
const KUALITAS_WEBP = 82;

export interface HasilUnggah {
  ok: boolean;
  url?: string;
  message?: string;
}

export async function unggahGambar(formData: FormData): Promise<HasilUnggah> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Tidak berwenang. Masuk ulang dengan akun admin." };
  }

  const berkas = formData.get("file");
  if (!(berkas instanceof File) || berkas.size === 0) {
    return { ok: false, message: "Tidak ada berkas yang diterima." };
  }

  if (!berkas.type.startsWith("image/")) {
    return { ok: false, message: "Berkas harus berupa gambar (JPG, PNG, WebP, dll)." };
  }

  if (berkas.size > BATAS_UKURAN_MENTAH) {
    return { ok: false, message: "Ukuran gambar maksimal 20 MB sebelum dikompres." };
  }

  const awalan = slugify(String(formData.get("prefix") ?? "foto")) || "foto";
  const acak = randomBytes(4).toString("hex");
  const namaBerkas = `${awalan}-${acak}.webp`;
  const pathRelatif = `public/foto/${namaBerkas}`;

  try {
    const mentah = Buffer.from(await berkas.arrayBuffer());

    const terkompres = await sharp(mentah)
      .rotate() // hormati orientasi EXIF dari kamera/HP
      .resize({ width: LEBAR_MAKS, withoutEnlargement: true })
      .webp({ quality: KUALITAS_WEBP })
      .toBuffer();

    await simpanBerkas(pathRelatif, terkompres, `konten: unggah foto ${namaBerkas}`);

    revalidatePath("/", "layout");

    return { ok: true, url: `/foto/${namaBerkas}` };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gagal memproses gambar.",
    };
  }
}
