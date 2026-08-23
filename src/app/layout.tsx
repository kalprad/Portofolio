import type { Metadata, Viewport } from "next";
import { Crimson_Pro, Atkinson_Hyperlegible } from "next/font/google";
import { themeInitScript } from "@/components/theme-toggle";
import "./globals.css";

/**
 * Tipografi: Crimson Pro untuk judul (nuansa akademik), Atkinson Hyperlegible
 * untuk isi (dirancang khusus untuk keterbacaan). Keduanya di-host sendiri
 * lewat next/font, jadi tidak ada permintaan ke server pihak ketiga.
 */
const display = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "700"],
});

const situsUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(situsUrl),
  title: {
    default: "Rizki Haikal — Structural Engineer & Researcher",
    template: "%s · Rizki Haikal",
  },
  description:
    "Portofolio, tulisan, dan arsip kuliah teknik sipil. Riset efektivitas damper pada struktur slab on pile.",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Rizki Haikal",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Jangan pernah mengunci zoom: pengguna berhak memperbesar teks.
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
      <head>
        {/* Menyetel tema sebelum cat pertama — mencegah kedip putih di mode gelap. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Lompat ke isi
        </a>
        {children}
      </body>
    </html>
  );
}
