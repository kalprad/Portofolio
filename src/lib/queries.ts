import "server-only";
import {
  readArchiveCollections,
  readCvEntries,
  readPosts,
  readProfile,
  readProjects,
  cariButirArsip,
  type KoleksiLengkap,
} from "@/lib/content";
import { catatJejak, bacaJejak, sheetsConfigured, type BarisJejak } from "@/lib/sheets";
import type { ArchiveItem, CvEntry, Post, Profile, Project } from "@/lib/types";

/**
 * Lapisan baca untuk halaman publik.
 *
 * Semuanya membaca berkas di dalam repositori, jadi tidak ada panggilan
 * jaringan dan tidak ada yang bisa gagal karena database mati. Penyaringan
 * status terbit terjadi di sini, bukan di komponen — supaya draf tidak pernah
 * bisa bocor hanya karena satu halaman lupa memfilter.
 */

// --- Profil & CV --------------------------------------------------------------

export async function getProfile(): Promise<Profile | null> {
  return readProfile();
}

export async function getCvEntries(): Promise<CvEntry[]> {
  return readCvEntries().filter((e) => e.is_published);
}

// --- Portofolio ---------------------------------------------------------------

export async function getProjects(
  opts: { featuredOnly?: boolean; limit?: number } = {},
): Promise<Project[]> {
  let hasil = readProjects().filter((p) => p.status === "published");

  if (opts.featuredOnly) hasil = hasil.filter((p) => p.is_featured);
  if (opts.limit) hasil = hasil.slice(0, opts.limit);

  return hasil;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return readProjects().find((p) => p.slug === slug && p.status === "published") ?? null;
}

// --- Tulisan ------------------------------------------------------------------

function sudahTerbit(p: Post): boolean {
  return Boolean(p.published_at && new Date(p.published_at) <= new Date());
}

/** Daftar tulisan: hanya yang publik dan sudah lewat waktu terbit. */
export async function getPosts(
  opts: { limit?: number; category?: string } = {},
): Promise<Post[]> {
  let hasil = readPosts().filter((p) => p.visibility === "public" && sudahTerbit(p));

  if (opts.category) hasil = hasil.filter((p) => p.category === opts.category);
  if (opts.limit) hasil = hasil.slice(0, opts.limit);

  return hasil;
}

/**
 * Satu tulisan. Yang berstatus `unlisted` sengaja ikut terambil: bisa dibuka
 * lewat tautan langsung, tapi tidak pernah muncul di daftar dan halamannya
 * memasang noindex. Yang `private` tidak pernah keluar dari sini.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const post = readPosts().find((p) => p.slug === slug);
  if (!post) return null;
  if (post.visibility === "private") return null;
  if (post.visibility === "public" && !sudahTerbit(post)) return null;
  return post;
}

export async function getPostCategories(): Promise<string[]> {
  const posts = await getPosts();
  return Array.from(new Set(posts.map((p) => p.category).filter(Boolean) as string[]));
}

// --- Arsip kuliah -------------------------------------------------------------

export async function getArchiveCollections(): Promise<KoleksiLengkap[]> {
  return readArchiveCollections().filter((k) => k.is_published);
}

export async function getArchiveCollectionBySlug(
  slug: string,
): Promise<KoleksiLengkap | null> {
  return readArchiveCollections().find((k) => k.slug === slug && k.is_published) ?? null;
}

export async function getArchiveItems(collectionSlug: string): Promise<ArchiveItem[]> {
  const koleksi = readArchiveCollections().find((k) => k.slug === collectionSlug);
  return koleksi ? koleksi.items.filter((b) => b.is_published) : [];
}

/** Jumlah berkas per koleksi, untuk ditampilkan di kartu daftar arsip. */
export async function getArchiveItemCounts(): Promise<Record<string, number>> {
  const hasil: Record<string, number> = {};
  for (const k of readArchiveCollections()) {
    hasil[k.id] = k.items.filter((b) => b.is_published).length;
  }
  return hasil;
}

export interface ArchiveItemWithCollection extends ArchiveItem {
  collection: { slug: string; title_id: string; is_published: boolean } | null;
}

export async function getArchiveItemById(
  id: string,
): Promise<ArchiveItemWithCollection | null> {
  const ditemukan = cariButirArsip(id);
  if (!ditemukan) return null;

  return {
    ...ditemukan.item,
    collection: {
      slug: ditemukan.collection.slug,
      title_id: ditemukan.collection.title_id,
      is_published: ditemukan.collection.is_published,
    },
  };
}

// --- Jejak akses --------------------------------------------------------------

export interface AccessLogInput {
  itemId: string | null;
  collectionSlug: string | null;
  itemTitle: string | null;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
  ipHash: string | null;
  outcome: "ok" | "ditolak" | "gagal";
}

export async function logArchiveAccess(input: AccessLogInput): Promise<void> {
  await catatJejak({
    waktu: new Date().toISOString(),
    email: input.userEmail ?? "",
    nama: input.userName ?? "",
    peran: input.userRole ?? "",
    mataKuliah: input.collectionSlug ?? "",
    berkas: input.itemTitle ?? "",
    hasil: input.outcome,
    ipHash: input.ipHash ?? "",
  });
}

export async function getAccessLog(limit = 200): Promise<BarisJejak[]> {
  return bacaJejak(limit);
}

export function isLoggingConfigured(): boolean {
  return sheetsConfigured();
}
