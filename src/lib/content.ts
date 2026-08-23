import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import matter from "gray-matter";
import type {
  ArchiveCollection,
  ArchiveItem,
  CvEntry,
  Post,
  Profile,
  Project,
} from "@/lib/types";

/**
 * Pembacaan konten dari berkas di dalam repositori.
 *
 * Repositori inilah databasenya. Konten panjang (proyek, tulisan) disimpan
 * sebagai Markdown dengan frontmatter; data terstruktur (profil, CV, arsip)
 * sebagai JSON. Keuntungan langsungnya: setiap perubahan punya riwayat versi
 * dan bisa dibandingkan lewat `git diff`.
 *
 * Terjemahan Inggris tinggal di berkas terpisah berakhiran `.en.md`, supaya
 * teks panjang tidak berdesakan di dalam frontmatter.
 *
 * Semua pembaca dibungkus `cache()` dari React: satu permintaan hanya menyentuh
 * disk sekali walaupun beberapa komponen memintanya.
 */

export const CONTENT_DIR = path.join(process.cwd(), "content");

export const PATHS = {
  profile: "content/profile.json",
  cv: "content/cv.json",
  projects: "content/projects",
  posts: "content/posts",
  archive: "content/archive",
} as const;

function absolut(relatif: string): string {
  return path.join(process.cwd(), relatif);
}

function bacaJson<T>(relatif: string, fallback: T): T {
  try {
    const teks = fs.readFileSync(absolut(relatif), "utf-8");
    return JSON.parse(teks) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`[content] gagal membaca ${relatif}:`, err);
    }
    return fallback;
  }
}

function daftarSlug(dirRelatif: string, ekstensi: string): string[] {
  try {
    return fs
      .readdirSync(absolut(dirRelatif))
      .filter((f) => f.endsWith(ekstensi) && !f.endsWith(`.en${ekstensi}`))
      .map((f) => f.slice(0, -ekstensi.length))
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`[content] gagal membaca folder ${dirRelatif}:`, err);
    }
    return [];
  }
}

interface Terurai {
  meta: Record<string, unknown>;
  body: string;
  bodyEn: string | null;
}

function uraikanMarkdown(dirRelatif: string, slug: string): Terurai | null {
  try {
    const mentah = fs.readFileSync(absolut(`${dirRelatif}/${slug}.md`), "utf-8");
    const { data, content } = matter(mentah);

    let bodyEn: string | null = null;
    try {
      const mentahEn = fs.readFileSync(absolut(`${dirRelatif}/${slug}.en.md`), "utf-8");
      bodyEn = matter(mentahEn).content.trim() || null;
    } catch {
      // Terjemahan memang opsional.
    }

    return { meta: data as Record<string, unknown>, body: content.trim(), bodyEn };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`[content] gagal mengurai ${dirRelatif}/${slug}.md:`, err);
    }
    return null;
  }
}

// --- Pembantu konversi -------------------------------------------------------

function teks(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function angka(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function bool(v: unknown, bawaan = false): boolean {
  return typeof v === "boolean" ? v : bawaan;
}

function daftarTeks(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim() !== "") {
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Waktu ubah berkas dipakai sebagai `updated_at` — cukup untuk sitemap. */
function diubahPada(relatif: string): string {
  try {
    return fs.statSync(absolut(relatif)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// --- Profil ------------------------------------------------------------------

export const readProfile = cache((): Profile | null => {
  const raw = bacaJson<Record<string, unknown> | null>(PATHS.profile, null);
  if (!raw) return null;

  return {
    id: "profile",
    full_name: teks(raw.full_name) ?? "Tanpa nama",
    headline_id: teks(raw.headline_id) ?? "",
    headline_en: teks(raw.headline_en),
    bio_id: teks(raw.bio_id),
    bio_en: teks(raw.bio_en),
    tagline_id: teks(raw.tagline_id),
    tagline_en: teks(raw.tagline_en),
    location: teks(raw.location),
    email: teks(raw.email),
    phone: teks(raw.phone),
    avatar_url: teks(raw.avatar_url),
    cv_file_url: teks(raw.cv_file_url),
    social_links: Array.isArray(raw.social_links)
      ? (raw.social_links as Profile["social_links"])
      : [],
    updated_at: diubahPada(PATHS.profile),
  };
});

// --- CV ----------------------------------------------------------------------

export const readCvEntries = cache((): CvEntry[] => {
  const raw = bacaJson<{ entries?: Record<string, unknown>[] }>(PATHS.cv, {});
  const entries = raw.entries ?? [];

  return entries
    .map((e, i): CvEntry => ({
      id: teks(e.id) ?? `cv-${i}`,
      section: (teks(e.section) ?? "pengalaman") as CvEntry["section"],
      title_id: teks(e.title_id) ?? "",
      title_en: teks(e.title_en),
      organization: teks(e.organization),
      location: teks(e.location),
      start_date: teks(e.start_date),
      end_date: teks(e.end_date),
      is_current: bool(e.is_current),
      description_id: teks(e.description_id),
      description_en: teks(e.description_en),
      url: teks(e.url),
      sort_order: angka(e.sort_order) ?? 0,
      is_published: bool(e.is_published, true),
      created_at: diubahPada(PATHS.cv),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
});

// --- Portofolio ---------------------------------------------------------------

export const readProjects = cache((): Project[] => {
  const relatif = PATHS.projects;

  return daftarSlug(relatif, ".md")
    .map((slug): Project | null => {
      const p = uraikanMarkdown(relatif, slug);
      if (!p) return null;
      const m = p.meta;

      return {
        id: slug,
        slug,
        title_id: teks(m.title_id) ?? slug,
        title_en: teks(m.title_en),
        summary_id: teks(m.summary_id),
        summary_en: teks(m.summary_en),
        body_id: p.body || null,
        body_en: p.bodyEn,
        role: teks(m.role),
        client: teks(m.client),
        location: teks(m.location),
        year_start: angka(m.year_start),
        year_end: angka(m.year_end),
        category: teks(m.category),
        tags: daftarTeks(m.tags),
        cover_image_url: teks(m.cover_image_url),
        gallery: Array.isArray(m.gallery) ? (m.gallery as Project["gallery"]) : [],
        external_url: teks(m.external_url),
        is_featured: bool(m.is_featured),
        status: (teks(m.status) ?? "draft") as Project["status"],
        sort_order: angka(m.sort_order) ?? 0,
        created_at: teks(m.created_at) ?? diubahPada(`${relatif}/${slug}.md`),
        updated_at: diubahPada(`${relatif}/${slug}.md`),
      };
    })
    .filter((p): p is Project => p !== null)
    .sort((a, b) => a.sort_order - b.sort_order);
});

// --- Tulisan ------------------------------------------------------------------

export const readPosts = cache((): Post[] => {
  const relatif = PATHS.posts;

  return daftarSlug(relatif, ".md")
    .map((slug): Post | null => {
      const p = uraikanMarkdown(relatif, slug);
      if (!p) return null;
      const m = p.meta;

      // gray-matter mengubah tanggal tanpa kutip menjadi objek Date.
      const terbit =
        m.published_at instanceof Date
          ? m.published_at.toISOString()
          : teks(m.published_at);

      return {
        id: slug,
        slug,
        title_id: teks(m.title_id) ?? slug,
        title_en: teks(m.title_en),
        excerpt_id: teks(m.excerpt_id),
        excerpt_en: teks(m.excerpt_en),
        body_id: p.body || null,
        body_en: p.bodyEn,
        cover_image_url: teks(m.cover_image_url),
        tags: daftarTeks(m.tags),
        category: teks(m.category),
        visibility: (teks(m.visibility) ?? "private") as Post["visibility"],
        published_at: terbit,
        reading_minutes: angka(m.reading_minutes),
        created_at: terbit ?? diubahPada(`${relatif}/${slug}.md`),
        updated_at: diubahPada(`${relatif}/${slug}.md`),
      };
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
});

// --- Arsip kuliah -------------------------------------------------------------

/**
 * Satu berkas JSON menampung satu mata kuliah beserta daftar berkasnya.
 *
 * ID butir yang dipakai di URL unduhan dibentuk sebagai `<slug>--<id-lokal>`,
 * sehingga rute `/api/arsip/[itemId]/unduh` cukup menerima satu parameter dan
 * tetap bisa menemukan berkas induknya.
 */
export const ITEM_ID_SEPARATOR = "--";

export function pisahItemId(itemId: string): { slug: string; lokal: string } | null {
  const i = itemId.indexOf(ITEM_ID_SEPARATOR);
  if (i <= 0) return null;
  return {
    slug: itemId.slice(0, i),
    lokal: itemId.slice(i + ITEM_ID_SEPARATOR.length),
  };
}

export interface KoleksiLengkap extends ArchiveCollection {
  items: ArchiveItem[];
}

export const readArchiveCollections = cache((): KoleksiLengkap[] => {
  const relatif = PATHS.archive;

  return daftarSlug(relatif, ".json")
    .map((slug): KoleksiLengkap | null => {
      const raw = bacaJson<Record<string, unknown> | null>(`${relatif}/${slug}.json`, null);
      if (!raw) return null;

      const itemsRaw = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];

      const items: ArchiveItem[] = itemsRaw
        .map((it, i): ArchiveItem => {
          const lokal = teks(it.id) ?? `butir-${i}`;
          return {
            id: `${slug}${ITEM_ID_SEPARATOR}${lokal}`,
            collection_id: slug,
            title_id: teks(it.title_id) ?? lokal,
            title_en: teks(it.title_en),
            description_id: teks(it.description_id),
            kind: (teks(it.kind) ?? "lainnya") as ArchiveItem["kind"],
            drive_file_id: teks(it.drive_file_id),
            drive_folder_id: teks(it.drive_folder_id),
            external_url: teks(it.external_url),
            file_size_bytes: angka(it.file_size_bytes),
            mime_type: teks(it.mime_type),
            access_level: (teks(it.access_level) ?? "ugm") as ArchiveItem["access_level"],
            sort_order: angka(it.sort_order) ?? 0,
            is_published: bool(it.is_published, true),
          };
        })
        .sort((a, b) => a.sort_order - b.sort_order);

      return {
        id: slug,
        slug,
        title_id: teks(raw.title_id) ?? slug,
        title_en: teks(raw.title_en),
        description_id: teks(raw.description_id),
        description_en: teks(raw.description_en),
        level: (teks(raw.level) ?? "s1") as ArchiveCollection["level"],
        semester: angka(raw.semester),
        course_code: teks(raw.course_code),
        credits: angka(raw.credits),
        lecturer: teks(raw.lecturer),
        cover_image_url: teks(raw.cover_image_url),
        sort_order: angka(raw.sort_order) ?? 0,
        is_published: bool(raw.is_published, false),
        created_at: diubahPada(`${relatif}/${slug}.json`),
        updated_at: diubahPada(`${relatif}/${slug}.json`),
        items,
      };
    })
    .filter((k): k is KoleksiLengkap => k !== null)
    .sort((a, b) => a.sort_order - b.sort_order);
});

/** Cari satu butir arsip beserta koleksi induknya, dari ID gabungan. */
export function cariButirArsip(itemId: string): {
  item: ArchiveItem;
  collection: KoleksiLengkap;
} | null {
  const pisah = pisahItemId(itemId);
  if (!pisah) return null;

  const collection = readArchiveCollections().find((k) => k.slug === pisah.slug);
  if (!collection) return null;

  const item = collection.items.find((b) => b.id === itemId);
  if (!item) return null;

  return { item, collection };
}
