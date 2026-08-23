"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getResource, type FieldDef, type ResourceDef } from "@/lib/admin-schema";
import { extractDriveId, fetchDriveMetadata } from "@/lib/drive";
import {
  contentWriteMode,
  hapusBerkas,
  keJson,
  keMarkdown,
  simpanBerkas,
} from "@/lib/content-write";
import { ITEM_ID_SEPARATOR, PATHS, pisahItemId } from "@/lib/content";
import {
  currentArchiveCollections,
  currentCvEntries,
  currentPosts,
  currentProfile,
  currentProjects,
} from "@/lib/content-live";
import { slugify, readingMinutes } from "@/lib/utils";
import type { FormState } from "@/lib/form-state";

/**
 * Penyuntingan konten dari panel admin.
 *
 * Setiap penyimpanan berakhir sebagai berkas di dalam repositori: Markdown
 * untuk isi panjang, JSON untuk data terstruktur. Di produksi berkas itu
 * ditulis lewat GitHub Contents API sehingga menjadi commit; di lokal langsung
 * ke disk. Lihat `src/lib/content-write.ts`.
 *
 * Setiap aksi memeriksa `requireAdmin()` sendiri. Middleware sudah menghalangi
 * halaman /admin, tapi server action bisa dipanggil langsung lewat HTTP — jadi
 * penjagaan di sini yang menentukan, bukan middleware.
 */

const DITOLAK: FormState = {
  ok: false,
  message: "Tidak berwenang. Masuk ulang dengan akun admin.",
};

function pesanSukses(): string {
  return contentWriteMode() === "github"
    ? "Tersimpan sebagai commit. Situs publik ikut berubah setelah Vercel selesai deploy ulang, sekitar satu menit."
    : "Tersimpan ke berkas di folder content/. Jangan lupa commit lewat git.";
}

// --- Pembacaan nilai formulir -------------------------------------------------

function bacaNilai(field: FieldDef, formData: FormData): unknown {
  const mentah = formData.get(field.name);

  switch (field.type) {
    case "checkbox":
      return mentah === "on" || mentah === "true";

    case "number": {
      const teks = String(mentah ?? "").trim();
      if (teks === "") return null;
      const angka = Number(teks);
      return Number.isFinite(angka) ? angka : null;
    }

    case "tags": {
      const teks = String(mentah ?? "").trim();
      if (teks === "") return [];
      return teks.split(",").map((t) => t.trim()).filter(Boolean);
    }

    case "drive": {
      const teks = String(mentah ?? "").trim();
      // Terima URL Drive maupun ID mentah — pengguna tinggal tempel apa adanya.
      return teks === "" ? null : extractDriveId(teks) || null;
    }

    case "date":
    case "datetime": {
      const teks = String(mentah ?? "").trim();
      if (teks === "") return null;
      return field.type === "datetime" ? new Date(teks).toISOString() : teks;
    }

    default: {
      const teks = String(mentah ?? "").trim();
      return teks === "" ? null : teks;
    }
  }
}

function validasi(resource: ResourceDef, nilai: Record<string, unknown>) {
  const errors: Record<string, string> = {};

  for (const f of resource.fields) {
    if (f.required) {
      const v = nilai[f.name];
      if (v === null || v === undefined || v === "") {
        errors[f.name] = `${f.label} wajib diisi.`;
      }
    }
    if (f.type === "url") {
      const v = nilai[f.name];
      // Selain URL lengkap, path situs sendiri juga sah — foto dan CV yang
      // ditaruh di folder public/ dirujuk sebagai "/foto/nama.webp", bukan
      // alamat penuh berdomain.
      if (typeof v === "string" && v !== "" && !/^(https?:\/\/\S+|\/\S*)$/i.test(v)) {
        errors[f.name] =
          "Harus URL lengkap (https://...) atau path di situs sendiri (diawali /).";
      }
    }
  }

  return errors;
}

function bereskanSlug(
  nilai: Record<string, unknown>,
  sumber: string,
): string {
  const sekarang = nilai.slug;
  const dasar =
    typeof sekarang === "string" && sekarang.trim() !== ""
      ? sekarang
      : String(nilai[sumber] ?? "");
  return slugify(dasar) || `tanpa-judul-${Date.now()}`;
}

// --- Penyimpanan per jenis konten ---------------------------------------------

async function simpanProyek(nilai: Record<string, unknown>, id: string | null) {
  const slug = bereskanSlug(nilai, "title_id");

  if ((await currentProjects()).some((p) => p.slug === slug && p.slug !== id)) {
    return { errors: { slug: "Slug ini sudah dipakai proyek lain." } };
  }

  const { body_id, body_en, slug: _s, ...meta } = nilai;

  await simpanBerkas(
    `${PATHS.projects}/${slug}.md`,
    keMarkdown(meta, typeof body_id === "string" ? body_id : ""),
    `konten: simpan proyek "${meta.title_id}"`,
  );

  if (typeof body_en === "string" && body_en.trim() !== "") {
    await simpanBerkas(
      `${PATHS.projects}/${slug}.en.md`,
      keMarkdown({ title_id: meta.title_en ?? meta.title_id }, body_en),
      `konten: simpan terjemahan proyek "${meta.title_id}"`,
    );
  }

  // Judul diubah sampai slug ikut berubah: buang berkas lama supaya tidak ada
  // dua salinan proyek yang sama di repositori.
  if (id && id !== slug) {
    await hapusBerkas(`${PATHS.projects}/${id}.md`, `konten: pindah proyek ke ${slug}`);
    await hapusBerkas(`${PATHS.projects}/${id}.en.md`, `konten: pindah proyek ke ${slug}`);
  }

  return { slug };
}

async function simpanTulisan(nilai: Record<string, unknown>, id: string | null) {
  const slug = bereskanSlug(nilai, "title_id");

  if ((await currentPosts()).some((p) => p.slug === slug && p.slug !== id)) {
    return { errors: { slug: "Slug ini sudah dipakai tulisan lain." } };
  }

  // Menerbitkan tanpa mengisi waktu terbit: pakai waktu sekarang.
  if (nilai.visibility === "public" && !nilai.published_at) {
    nilai.published_at = new Date().toISOString();
  }
  nilai.reading_minutes = readingMinutes(
    typeof nilai.body_id === "string" ? nilai.body_id : null,
  );

  const { body_id, body_en, slug: _s, ...meta } = nilai;

  await simpanBerkas(
    `${PATHS.posts}/${slug}.md`,
    keMarkdown(meta, typeof body_id === "string" ? body_id : ""),
    `konten: simpan tulisan "${meta.title_id}"`,
  );

  if (typeof body_en === "string" && body_en.trim() !== "") {
    await simpanBerkas(
      `${PATHS.posts}/${slug}.en.md`,
      keMarkdown({ title_id: meta.title_en ?? meta.title_id }, body_en),
      `konten: simpan terjemahan tulisan "${meta.title_id}"`,
    );
  }

  if (id && id !== slug) {
    await hapusBerkas(`${PATHS.posts}/${id}.md`, `konten: pindah tulisan ke ${slug}`);
    await hapusBerkas(`${PATHS.posts}/${id}.en.md`, `konten: pindah tulisan ke ${slug}`);
  }

  return { slug };
}

async function simpanEntriCv(nilai: Record<string, unknown>, id: string | null) {
  const entries = (await currentCvEntries()).map((e) => ({ ...e })) as Record<string, unknown>[];
  const entriId = id ?? `cv-${slugify(String(nilai.title_id ?? ""))}-${Date.now().toString(36)}`;

  const baru = { ...nilai, id: entriId };
  const i = entries.findIndex((e) => String(e.id) === entriId);
  if (i >= 0) entries[i] = baru;
  else entries.push(baru);

  // `created_at` hanya berguna saat data berasal dari database; di berkas, waktu
  // ubah diambil dari berkasnya sendiri.
  for (const e of entries) delete e.created_at;

  await simpanBerkas(
    PATHS.cv,
    keJson({ entries }),
    `konten: simpan entri CV "${nilai.title_id}"`,
  );

  return { slug: entriId };
}

async function simpanMataKuliah(nilai: Record<string, unknown>, id: string | null) {
  const slug = bereskanSlug(nilai, "title_id");
  const semua = await currentArchiveCollections();

  if (semua.some((k) => k.slug === slug && k.slug !== id)) {
    return { errors: { slug: "Slug ini sudah dipakai mata kuliah lain." } };
  }

  // Daftar berkas tinggal di berkas JSON yang sama, jadi harus dibawa serta —
  // formulir mata kuliah tidak menyunting butir-butirnya.
  const lama = id ? semua.find((k) => k.slug === id) : undefined;
  const items = (lama?.items ?? []).map((b) => bersihkanButir(b));

  const { slug: _s, id: _i, ...meta } = nilai;

  await simpanBerkas(
    `${PATHS.archive}/${slug}.json`,
    keJson({ ...meta, items }),
    `konten: simpan mata kuliah "${meta.title_id}"`,
  );

  if (id && id !== slug) {
    await hapusBerkas(`${PATHS.archive}/${id}.json`, `konten: pindah mata kuliah ke ${slug}`);
  }

  return { slug };
}

/**
 * Bentuk butir sebagaimana disimpan di berkas — tanpa ID gabungan turunan.
 *
 * Menerima `object` supaya bisa dipanggil baik dengan `ArchiveItem` hasil
 * pembacaan maupun dengan nilai mentah dari formulir.
 */
function bersihkanButir(masukan: object): Record<string, unknown> {
  const b = masukan as Record<string, unknown>;
  const lokal = pisahItemId(String(b.id))?.lokal ?? String(b.id);
  return {
    id: lokal,
    title_id: b.title_id,
    title_en: b.title_en ?? null,
    description_id: b.description_id ?? null,
    kind: b.kind,
    drive_file_id: b.drive_file_id ?? null,
    drive_folder_id: b.drive_folder_id ?? null,
    external_url: b.external_url ?? null,
    file_size_bytes: b.file_size_bytes ?? null,
    mime_type: b.mime_type ?? null,
    access_level: b.access_level,
    sort_order: b.sort_order ?? 0,
    is_published: b.is_published ?? true,
  };
}

async function simpanButirArsip(nilai: Record<string, unknown>, id: string | null) {
  const tujuanSlug = String(nilai.collection_id ?? "");
  const semua = await currentArchiveCollections();
  const tujuan = semua.find((k) => k.slug === tujuanSlug);

  if (!tujuan) {
    return { errors: { collection_id: "Mata kuliah tidak ditemukan." } };
  }

  // Lengkapi ukuran dan tipe dari Drive kalau dikosongkan.
  const fileId = nilai.drive_file_id;
  if (typeof fileId === "string" && fileId && (!nilai.mime_type || !nilai.file_size_bytes)) {
    try {
      const meta = await fetchDriveMetadata(fileId);
      if (meta) {
        nilai.mime_type = nilai.mime_type ?? meta.mimeType;
        nilai.file_size_bytes = nilai.file_size_bytes ?? meta.size;
      }
    } catch {
      // Metadata sekadar pelengkap tampilan — kegagalannya tidak menghalangi
      // penyimpanan.
    }
  }

  const asal = id ? pisahItemId(id) : null;
  const lokal =
    asal?.lokal ?? `${slugify(String(nilai.title_id ?? "berkas"))}-${Date.now().toString(36)}`;

  const butirBaru = bersihkanButir({ ...nilai, id: lokal });

  // Pindah mata kuliah berarti dua berkas JSON ikut berubah: yang lama
  // kehilangan butirnya, yang baru menerimanya.
  const pindah = Boolean(asal && asal.slug !== tujuanSlug);

  const itemsTujuan = tujuan.items.map((b) => bersihkanButir(b));
  const iSama = itemsTujuan.findIndex((b) => b.id === lokal);
  if (iSama >= 0 && !pindah) itemsTujuan[iSama] = butirBaru;
  else itemsTujuan.push(butirBaru);

  await simpanBerkas(
    `${PATHS.archive}/${tujuanSlug}.json`,
    keJson(tanpaItems(tujuan, itemsTujuan)),
    `konten: simpan berkas arsip "${nilai.title_id}"`,
  );

  if (pindah && asal) {
    const lama = semua.find((k) => k.slug === asal.slug);
    if (lama) {
      const sisa = lama.items.filter((b) => b.id !== id).map((b) => bersihkanButir(b));
      await simpanBerkas(
        `${PATHS.archive}/${asal.slug}.json`,
        keJson(tanpaItems(lama, sisa)),
        `konten: pindahkan berkas arsip dari ${asal.slug}`,
      );
    }
  }

  return { slug: `${tujuanSlug}${ITEM_ID_SEPARATOR}${lokal}` };
}

/** Bentuk berkas JSON mata kuliah: metadata koleksi + daftar butir. */
function tanpaItems(
  masukan: object,
  items: Record<string, unknown>[],
): Record<string, unknown> {
  const koleksi = masukan as Record<string, unknown>;
  return {
    title_id: koleksi.title_id,
    title_en: koleksi.title_en ?? null,
    description_id: koleksi.description_id ?? null,
    description_en: koleksi.description_en ?? null,
    level: koleksi.level,
    semester: koleksi.semester ?? null,
    course_code: koleksi.course_code ?? null,
    credits: koleksi.credits ?? null,
    lecturer: koleksi.lecturer ?? null,
    cover_image_url: koleksi.cover_image_url ?? null,
    sort_order: koleksi.sort_order ?? 0,
    is_published: koleksi.is_published ?? false,
    items,
  };
}

async function simpanProfil(nilai: Record<string, unknown>) {
  const lama = await currentProfile();

  await simpanBerkas(
    PATHS.profile,
    // Tautan sosial tidak disunting lewat formulir ini, jadi nilai lamanya
    // dipertahankan alih-alih ikut terhapus.
    keJson({ ...nilai, social_links: lama?.social_links ?? [] }),
    "konten: perbarui profil",
  );

  return { slug: "profile" };
}

// --- Aksi utama ---------------------------------------------------------------

export async function simpanEntitas(
  resourceKey: string,
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await requireAdmin())) return DITOLAK;

  const resource = getResource(resourceKey);

  const nilai: Record<string, unknown> = {};
  for (const f of resource.fields) {
    nilai[f.name] = bacaNilai(f, formData);
  }

  const errors = validasi(resource, nilai);
  if (Object.keys(errors).length > 0) {
    return { ok: false, message: "Ada isian yang belum benar.", errors };
  }

  try {
    let hasil: { slug?: string; errors?: Record<string, string> };

    switch (resource.key) {
      case "projects": hasil = await simpanProyek(nilai, id); break;
      case "posts":    hasil = await simpanTulisan(nilai, id); break;
      case "cv":       hasil = await simpanEntriCv(nilai, id); break;
      case "arsip":    hasil = await simpanMataKuliah(nilai, id); break;
      case "berkas":   hasil = await simpanButirArsip(nilai, id); break;
      case "profil":   hasil = await simpanProfil(nilai); break;
      default:
        return { ok: false, message: `Jenis konten tidak dikenal: ${resource.key}` };
    }

    if (hasil.errors) {
      return { ok: false, message: "Ada isian yang belum benar.", errors: hasil.errors };
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gagal menyimpan.",
    };
  }

  revalidateSemua(resource);
  return { ok: true, message: pesanSukses() };
}

export async function hapusEntitas(resourceKey: string, id: string) {
  if (!(await requireAdmin())) return;

  const resource = getResource(resourceKey);

  switch (resource.key) {
    case "projects":
      await hapusBerkas(`${PATHS.projects}/${id}.md`, `konten: hapus proyek ${id}`);
      await hapusBerkas(`${PATHS.projects}/${id}.en.md`, `konten: hapus proyek ${id}`);
      break;

    case "posts":
      await hapusBerkas(`${PATHS.posts}/${id}.md`, `konten: hapus tulisan ${id}`);
      await hapusBerkas(`${PATHS.posts}/${id}.en.md`, `konten: hapus tulisan ${id}`);
      break;

    case "arsip":
      await hapusBerkas(`${PATHS.archive}/${id}.json`, `konten: hapus mata kuliah ${id}`);
      break;

    case "cv": {
      const entries = (await currentCvEntries())
        .filter((e) => e.id !== id)
        .map(({ created_at: _c, ...e }) => e);
      await simpanBerkas(PATHS.cv, keJson({ entries }), `konten: hapus entri CV ${id}`);
      break;
    }

    case "berkas": {
      const pisah = pisahItemId(id);
      const koleksi = pisah
        ? (await currentArchiveCollections()).find((k) => k.slug === pisah.slug)
        : undefined;
      if (koleksi) {
        const sisa = koleksi.items.filter((b) => b.id !== id).map((b) => bersihkanButir(b));
        await simpanBerkas(
          `${PATHS.archive}/${koleksi.slug}.json`,
          keJson(tanpaItems(koleksi, sisa)),
          `konten: hapus berkas arsip ${id}`,
        );
      }
      break;
    }

    default:
      return;
  }

  revalidateSemua(resource);
  redirect(resource.basePath);
}

function revalidateSemua(resource: ResourceDef) {
  revalidatePath("/", "layout");
  revalidatePath(resource.basePath);
}
