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
};

export default nextConfig;
