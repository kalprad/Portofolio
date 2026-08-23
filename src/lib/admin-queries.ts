import "server-only";
import {
  currentArchiveCollections,
  currentCvEntries,
  currentPosts,
  currentProfile,
  currentProjects,
} from "@/lib/content-live";
import { bacaJejak, sheetsConfigured } from "@/lib/sheets";
import type { ResourceDef } from "@/lib/admin-schema";

/**
 * Pembacaan untuk panel admin — berbeda dari `queries.ts` dalam dua hal:
 * draf dan entri tersembunyi ikut terambil, dan sumbernya selalu keadaan
 * GitHub yang sebenar-benarnya (lewat `content-live.ts`), bukan salinan yang
 * ikut ter-bundel saat build terakhir. Ini mencegah formulir admin terisi
 * data basi lalu menimpa perubahan yang belum sempat ter-deploy — lihat
 * penjelasan lengkapnya di `content-live.ts`.
 *
 * Semua pemanggil berada di balik middleware /admin dan `requireAdmin()`.
 */

type Baris = Record<string, unknown>;

export async function listRows(resource: ResourceDef): Promise<Baris[]> {
  switch (resource.key) {
    case "projects":
      return (await currentProjects()) as unknown as Baris[];

    case "posts":
      return (await currentPosts()) as unknown as Baris[];

    case "cv":
      return (await currentCvEntries()) as unknown as Baris[];

    case "arsip":
      return (await currentArchiveCollections()).map(({ items: _items, ...k }) => k) as unknown as Baris[];

    case "berkas":
      // Butir arsip tersebar di banyak berkas JSON; di sini diratakan menjadi
      // satu daftar supaya bisa ditampilkan sebagai tabel tunggal.
      return (await currentArchiveCollections()).flatMap((k) => k.items) as unknown as Baris[];

    case "profil": {
      const p = await currentProfile();
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
  const p = await currentProfile();
  return p ? (p as unknown as Baris) : null;
}

export async function listItemsByCollection(collectionSlug: string): Promise<Baris[]> {
  const koleksi = (await currentArchiveCollections()).find((k) => k.slug === collectionSlug);
  return koleksi ? (koleksi.items as unknown as Baris[]) : [];
}

export async function collectionOptions(): Promise<{ value: string; label: string }[]> {
  return (await currentArchiveCollections()).map((k) => ({
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
  const [proyek, tulisan, koleksi, cv] = await Promise.all([
    currentProjects(),
    currentPosts(),
    currentArchiveCollections(),
    currentCvEntries(),
  ]);

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
    cv: cv.length,
  };
}
