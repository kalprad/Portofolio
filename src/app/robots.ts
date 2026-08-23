import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Panel admin, jalur unduhan, dan halaman masuk tidak perlu diindeks.
      disallow: ["/admin", "/api/", "/masuk"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
