import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
    ],
  },

  // Konten dibaca dari disk saat permintaan datang, dan penelusuran berkas
  // otomatis tidak melihat pembacaan folder yang dinamis. Tanpa baris ini,
  // folder content/ tidak ikut terbawa ke bundel Vercel dan situs tampil kosong
  // di produksi.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*"],
  },

  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },

  // Pradana Engine adalah halaman HTML mandiri (solver FEA berbasis Pyodide)
  // di public/pradana-engine/. Rewrite ini membuatnya terbuka di
  // /pradana-engine tanpa akhiran index.html.
  async rewrites() {
    return [{ source: "/pradana-engine", destination: "/pradana-engine/index.html" }];
  },
};

export default nextConfig;
