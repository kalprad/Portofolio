import Link from "next/link";
import { Container, ButtonLink } from "@/components/ui/primitives";

export default function TidakDitemukan() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="isi" className="flex flex-1 items-center">
        <Container size="narrow">
          <div className="py-20">
            <p className="eyebrow">Galat 404</p>
            <h1 className="display-lg mt-3">Halaman ini tidak ada</h1>
            <p className="mt-5 text-muted-foreground">
              Tautannya mungkin sudah berubah, atau halamannya belum pernah ada.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/">Kembali ke beranda</ButtonLink>
              <ButtonLink href="/portofolio" variant="outline">
                Lihat portofolio
              </ButtonLink>
            </div>

            <nav aria-label="Tautan lain" className="mt-12 border-t border-border pt-6">
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {[
                  { href: "/tentang", label: "Tentang" },
                  { href: "/tulisan", label: "Tulisan" },
                  { href: "/arsip", label: "Arsip Kuliah" },
                  { href: "/cv", label: "CV" },
                ].map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className="link-underline">
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Container>
      </main>
    </div>
  );
}
