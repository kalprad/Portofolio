"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, LogIn } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const TAUTAN = [
  { href: "/tentang", label: "Tentang" },
  { href: "/portofolio", label: "Portofolio" },
  { href: "/tulisan", label: "Tulisan" },
  { href: "/arsip", label: "Arsip Kuliah" },
  { href: "/cv", label: "CV" },
];

/** Tautan tambahan yang cuma tampil buat pemilik situs yang sedang masuk. */
const TAUTAN_ADMIN = [{ href: "/admin/kerja", label: "Kerja" }];

export function HeaderNav({
  nama,
  isAdmin,
  sudahMasuk,
}: {
  nama: string;
  isAdmin: boolean;
  sudahMasuk: boolean;
}) {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);
  const tautan = isAdmin ? [...TAUTAN, ...TAUTAN_ADMIN] : TAUTAN;

  // Menu mobile ditutup setiap kali rute berubah — tombol kembali peramban
  // tidak boleh meninggalkan panel yang menggantung terbuka.
  useEffect(() => {
    setTerbuka(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = terbuka ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [terbuka]);

  function aktif(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight"
          >
            {nama}
          </Link>

          <nav aria-label="Navigasi utama" className="hidden md:block">
            <ul className="flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1">
              {tautan.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={aktif(t.href) ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-[36px] items-center rounded-full px-4 text-sm transition-colors duration-200",
                      aktif(t.href)
                        ? "bg-foreground font-medium text-background"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link
                href="/admin"
                className="hidden min-h-[40px] items-center gap-2 rounded px-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground md:inline-flex"
              >
                <LayoutDashboard className="size-4" aria-hidden />
                Panel
              </Link>
            ) : !sudahMasuk ? (
              <Link
                href="/masuk"
                className="hidden min-h-[40px] items-center gap-2 rounded px-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground md:inline-flex"
              >
                <LogIn className="size-4" aria-hidden />
                Masuk
              </Link>
            ) : null}

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setTerbuka((v) => !v)}
              aria-expanded={terbuka}
              aria-controls="menu-mobile"
              aria-label={terbuka ? "Tutup menu" : "Buka menu"}
              className="inline-flex size-11 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground md:hidden"
            >
              {terbuka ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
            </button>
          </div>
        </div>
      </Container>

      {terbuka ? (
        <div
          id="menu-mobile"
          className="border-t border-border bg-background md:hidden"
        >
          <Container size="wide">
            <ul className="flex flex-col py-2">
              {tautan.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={aktif(t.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-[52px] items-center border-b border-border text-base transition-colors duration-200",
                      aktif(t.href) ? "font-medium text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={isAdmin ? "/admin" : "/masuk"}
                  className="flex min-h-[52px] items-center gap-2 text-base text-muted-foreground"
                >
                  {isAdmin ? (
                    <>
                      <LayoutDashboard className="size-4" aria-hidden /> Panel admin
                    </>
                  ) : (
                    <>
                      <LogIn className="size-4" aria-hidden /> Masuk
                    </>
                  )}
                </Link>
              </li>
            </ul>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
