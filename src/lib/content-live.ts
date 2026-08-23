import "server-only";
import matter from "gray-matter";
import { angka, bool, daftarTeks, ITEM_ID_SEPARATOR, PATHS, teks } from "@/lib/content";
import { contentWriteMode, githubBranch } from "@/lib/content-write";
import type { CvEntry, Post, Profile, Project } from "@/lib/types";
import {
  readArchiveCollections as readArchiveCollectionsLokal,
  readCvEntries as readCvEntriesLokal,
  readPosts as readPostsLokal,
  readProfile as readProfileLokal,
  readProjects as readProjectsLokal,
  type KoleksiLengkap,
} from "@/lib/content";

/**
 * Pembacaan konten langsung dari GitHub — dipakai KHUSUS oleh panel admin.
 *
 * Kenapa ini perlu ada padahal `content.ts` sudah membaca konten: berkas yang
 * dibaca `content.ts` di produksi adalah salinan yang ikut ter-bundel saat
 * Vercel TERAKHIR KALI membangun situs, bukan isi GitHub yang sebenarnya saat
 * ini. Setiap simpan membuat commit baru dan memicu build baru, tapi build itu
 * makan waktu sekitar satu menit.
 *
 * Skenario yang jadi bug tanpa berkas ini: admin menyimpan perubahan A →
 * commit A terkirim ke GitHub, build mulai jalan. Sebelum build itu selesai,
 * admin membuka lagi formulir yang sama dan menyimpan perubahan B. Karena
 * situs masih menyajikan build LAMA (sebelum A), formulir B terisi dari data
 * SEBELUM perubahan A — sehingga saat B disimpan, seluruh isian ditulis ulang
 * dari kondisi sebelum A, dan perubahan A hilang tertimpa. Ini disebut
 * lost update / race condition tulis-setelah-baca-basi.
 *
 * Perbaikannya: apa pun yang dipakai untuk MENGISI ULANG formulir admin dan
 * untuk DIGABUNG saat menyimpan (bukan yang ditampilkan ke pengunjung situs)
 * harus selalu membaca keadaan GitHub yang sebenar-benarnya, bukan salinan
 * beku tadi. Situs publik tetap memakai `content.ts` seperti biasa — bacaannya
 * jauh lebih cepat, dan basi maksimal semenit itu sudah diberitahukan ke
 * pengguna setiap kali menyimpan.
 *
 * Di mode lokal (`npm run dev`), tidak ada build terpisah — tulis langsung ke
 * disk, jadi `content.ts` sudah selalu segar. Fungsi `current*()` di bawah
 * karena itu hanya memanggil GitHub saat `contentWriteMode() === "github"`.
 */

const API = "https://api.github.com";

function repoUrl(relatif: string): string {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  return `${API}/repos/${owner}/${repo}/contents/${relatif
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function bacaTeksGithub(relatif: string): Promise<string | null> {
  const url = new URL(repoUrl(relatif));
  url.searchParams.set("ref", githubBranch());

  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub menolak permintaan (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { content?: string };
  if (!data.content) return null;
  // GitHub membungkus base64-nya dengan baris baru setiap 60 karakter.
  return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf-8");
}

async function daftarSlugGithub(dirRelatif: string, ekstensi: string): Promise<string[]> {
  const url = new URL(repoUrl(dirRelatif));
  url.searchParams.set("ref", githubBranch());

  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub menolak permintaan (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];

  return (data as { name: string; type: string }[])
    .filter((f) => f.type === "file" && f.name.endsWith(ekstensi) && !f.name.endsWith(`.en${ekstensi}`))
    .map((f) => f.name.slice(0, -ekstensi.length))
    .sort();
}

async function uraikanMarkdownGithub(
  dirRelatif: string,
  slug: string,
): Promise<{ meta: Record<string, unknown>; body: string; bodyEn: string | null } | null> {
  const mentah = await bacaTeksGithub(`${dirRelatif}/${slug}.md`);
  if (mentah === null) return null;

  const { data, content } = matter(mentah);

  const mentahEn = await bacaTeksGithub(`${dirRelatif}/${slug}.en.md`);
  const bodyEn = mentahEn ? matter(mentahEn).content.trim() || null : null;

  return { meta: data as Record<string, unknown>, body: content.trim(), bodyEn };
}

// --- Profil ------------------------------------------------------------------

async function bacaProfilGithub(): Promise<Profile | null> {
  const mentah = await bacaTeksGithub(PATHS.profile);
  if (!mentah) return null;
  const raw = JSON.parse(mentah) as Record<string, unknown>;

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
    hero_photo_url: teks(raw.hero_photo_url),
    cv_file_url: teks(raw.cv_file_url),
    social_links: Array.isArray(raw.social_links) ? (raw.social_links as Profile["social_links"]) : [],
    updated_at: new Date().toISOString(),
  };
}

export async function currentProfile(): Promise<Profile | null> {
  return contentWriteMode() === "github" ? bacaProfilGithub() : readProfileLokal();
}

// --- CV ------------------------------------------------------------------------

async function bacaCvGithub(): Promise<CvEntry[]> {
  const mentah = await bacaTeksGithub(PATHS.cv);
  const raw = mentah ? (JSON.parse(mentah) as { entries?: Record<string, unknown>[] }) : {};
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
      created_at: new Date().toISOString(),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function currentCvEntries(): Promise<CvEntry[]> {
  return contentWriteMode() === "github" ? bacaCvGithub() : readCvEntriesLokal();
}

// --- Portofolio ------------------------------------------------------------------

async function bacaProyekGithub(): Promise<Project[]> {
  const relatif = PATHS.projects;
  const slugs = await daftarSlugGithub(relatif, ".md");

  const hasil = await Promise.all(
    slugs.map(async (slug): Promise<Project | null> => {
      const p = await uraikanMarkdownGithub(relatif, slug);
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
        created_at: teks(m.created_at) ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }),
  );

  return hasil.filter((p): p is Project => p !== null).sort((a, b) => a.sort_order - b.sort_order);
}

export async function currentProjects(): Promise<Project[]> {
  return contentWriteMode() === "github" ? bacaProyekGithub() : readProjectsLokal();
}

// --- Tulisan ------------------------------------------------------------------

async function bacaTulisanGithub(): Promise<Post[]> {
  const relatif = PATHS.posts;
  const slugs = await daftarSlugGithub(relatif, ".md");

  const hasil = await Promise.all(
    slugs.map(async (slug): Promise<Post | null> => {
      const p = await uraikanMarkdownGithub(relatif, slug);
      if (!p) return null;
      const m = p.meta;
      const terbit = m.published_at instanceof Date ? m.published_at.toISOString() : teks(m.published_at);

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
        created_at: terbit ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }),
  );

  return hasil
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

export async function currentPosts(): Promise<Post[]> {
  return contentWriteMode() === "github" ? bacaTulisanGithub() : readPostsLokal();
}

// --- Arsip kuliah -------------------------------------------------------------

async function bacaArsipGithub(): Promise<KoleksiLengkap[]> {
  const relatif = PATHS.archive;
  const slugs = await daftarSlugGithub(relatif, ".json");

  const hasil = await Promise.all(
    slugs.map(async (slug): Promise<KoleksiLengkap | null> => {
      const mentah = await bacaTeksGithub(`${relatif}/${slug}.json`);
      if (!mentah) return null;
      const raw = JSON.parse(mentah) as Record<string, unknown>;

      const itemsRaw = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
      const items = itemsRaw
        .map((it, i) => {
          const lokal = teks(it.id) ?? `butir-${i}`;
          return {
            id: `${slug}${ITEM_ID_SEPARATOR}${lokal}`,
            collection_id: slug,
            title_id: teks(it.title_id) ?? lokal,
            title_en: teks(it.title_en),
            description_id: teks(it.description_id),
            kind: (teks(it.kind) ?? "lainnya") as KoleksiLengkap["items"][number]["kind"],
            drive_file_id: teks(it.drive_file_id),
            drive_folder_id: teks(it.drive_folder_id),
            external_url: teks(it.external_url),
            file_size_bytes: angka(it.file_size_bytes),
            mime_type: teks(it.mime_type),
            access_level: (teks(it.access_level) ?? "ugm") as KoleksiLengkap["items"][number]["access_level"],
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
        level: (teks(raw.level) ?? "s1") as KoleksiLengkap["level"],
        semester: angka(raw.semester),
        course_code: teks(raw.course_code),
        credits: angka(raw.credits),
        lecturer: teks(raw.lecturer),
        cover_image_url: teks(raw.cover_image_url),
        sort_order: angka(raw.sort_order) ?? 0,
        is_published: bool(raw.is_published, false),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        items,
      };
    }),
  );

  return hasil.filter((k): k is KoleksiLengkap => k !== null).sort((a, b) => a.sort_order - b.sort_order);
}

export async function currentArchiveCollections(): Promise<KoleksiLengkap[]> {
  return contentWriteMode() === "github" ? bacaArsipGithub() : readArchiveCollectionsLokal();
}
