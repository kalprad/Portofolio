import type { MetadataRoute } from "next";
import { getPosts, getProjects, getArchiveCollections } from "@/lib/queries";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [proyek, tulisan, arsip] = await Promise.all([
    getProjects(),
    getPosts(),
    getArchiveCollections(),
  ]);

  const statis = ["", "/tentang", "/cv", "/portofolio", "/tulisan", "/arsip"].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  return [
    ...statis,
    ...proyek.map((p) => ({
      url: `${BASE}/portofolio/${p.slug}`,
      lastModified: new Date(p.updated_at),
      priority: 0.7,
    })),
    // Tulisan tak terdaftar sengaja tidak masuk: `getPosts` hanya
    // mengembalikan yang publik.
    ...tulisan.map((p) => ({
      url: `${BASE}/tulisan/${p.slug}`,
      lastModified: new Date(p.updated_at),
      priority: 0.6,
    })),
    ...arsip.map((a) => ({
      url: `${BASE}/arsip/${a.slug}`,
      lastModified: new Date(a.updated_at),
      priority: 0.5,
    })),
  ];
}
