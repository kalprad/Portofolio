import "server-only";
import {
  readArchiveCollections,
  readCvEntries,
  readPosts,
  readProfile,
  readProjects,
} from "@/lib/content";
import { bacaJejak, sheetsConfigured } from "@/lib/sheets";
import type { ResourceDef } from "@/lib/admin-schema";

/**
 * Pembacaan untuk panel admin — berbeda dari `queries.ts` karena di sini draf
 * dan entri tersembunyi ikut terambil.
 *
 * Semua pemanggil berada di balik middleware /admin dan `requireAdmin()`.
 */

type Baris = Record<string, unknown>;

export async function listRows(resource: ResourceDef): Promise<Baris[]> {
  switch (resource.key) {
    case "projects":
      return readProjects() as unknown as Baris[];

    case "posts":
      return readPosts() as unknown as Baris[];

    case "cv":
      return readCvEntries() as unknown as Baris[];

    case "arsip":
      return readArchiveCollections().map(({ items: _items, ...k }) => k) as unknown as Baris[];

    case "berkas":
      // Butir arsip tersebar di banyak berkas JSON; di sini diratakan menjadi
      // satu daftar supaya bisa ditampilkan sebagai tabel tunggal.
      return readArchiveCollections().flatMap((k) => k.items) as unknown as Baris[];

    case "profil": {
      const p = readProfile();
      return p ? [p as unknown as Baris] : [];
    }

    default:
      return [];
  }
}

export async function getRow(resource: ResourceDef, id: string): Promise<Baris | null> {
  const rows = await listRows(resource);
  return rows.find((r) => String(r.id) === id) ?? null;
}

export async function getProfileRow(): Promise<Baris | null> {
  const p = readProfile();
  return p ? (p as unknown as Baris) : null;
}

export async function listItemsByCollection(collectionSlug: string): Promise<Baris[]> {
  const koleksi = readArchiveCollections().find((k) => k.slug === collectionSlug);
  return koleksi ? (koleksi.items as unknown as Baris[]) : [];
}

export async function collectionOptions(): Promise<{ value: string; label: string }[]> {
  return readArchiveCollections().map((k) => ({
    value: k.slug,
    label: `${k.level.toUpperCase()} — ${k.title_id}`,
  }));
}

export interface StatistikAdmin {
  proyek: { total: number; terbit: number };
  tulisan: { total: number; publik: number; takTerdaftar: number; draf: number };
  arsip: { mataKuliah: number; berkas: number; unduhan: number };
  cv: number;
}

export async function statistikAdmin(): Promise<StatistikAdmin> {
  const proyek = readProjects();
  const tulisan = readPosts();
  const koleksi = readArchiveCollections();

  // Jumlah unduhan tidak lagi disimpan bersama konten — ia dihitung dari jejak
  // di Google Sheets, yang memang satu-satunya tempat angka itu hidup.
  const jejak = sheetsConfigured() ? await bacaJejak(1000) : [];

  return {
    proyek: {
      total: proyek.length,
      terbit: proyek.filter((p) => p.status === "published").length,
    },
    tulisan: {
      total: tulisan.length,
      publik: tulisan.filter((p) => p.visibility === "public").length,
      takTerdaftar: tulisan.filter((p) => p.visibility === "unlisted").length,
      draf: tulisan.filter((p) => p.visibility === "private").length,
    },
    arsip: {
      mataKuliah: koleksi.length,
      berkas: koleksi.reduce((a, k) => a + k.items.length, 0),
      unduhan: jejak.filter((j) => j.hasil === "ok").length,
    },
    cv: readCvEntries().length,
  };
}
