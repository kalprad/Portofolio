import type { Metadata } from "next";
import Link from "next/link";
import { Container, EmptyState } from "@/components/ui/primitives";
import { ProjectCard } from "@/components/cards";
import { getProjects } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Portofolio",
  description: "Proyek, riset, dan pekerjaan teknik sipil yang pernah saya kerjakan.",
};

export default async function DaftarPortofolio({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const semua = await getProjects();

  const kategoriTersedia = Array.from(
    new Set(semua.map((p) => p.category).filter(Boolean) as string[]),
  );

  const terpilih = kategori && kategoriTersedia.includes(kategori) ? kategori : null;
  const proyek = terpilih ? semua.filter((p) => p.category === terpilih) : semua;

  return (
    <Container size="wide">
      <div className="py-16 sm:py-24">
        <p className="eyebrow">Portofolio</p>
        <h1 className="display-lg mt-4 max-w-3xl">Pekerjaan &amp; riset</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Proyek struktur, riset, dan pekerjaan lain yang pernah saya tangani —
          lengkap dengan peran saya di dalamnya.
        </p>

        {/* Penyaring memakai URL, bukan state, supaya hasilnya bisa dibagikan
            dan tombol kembali peramban tetap masuk akal. */}
        {kategoriTersedia.length > 1 ? (
          <nav aria-label="Saring menurut kategori" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href="/portofolio"
                  aria-current={!terpilih ? "true" : undefined}
                  className={cn(
                    "inline-flex min-h-[40px] items-center rounded border px-4 text-sm transition-colors duration-200",
                    !terpilih
                      ? "border-transparent bg-primary text-on-primary"
                      : "border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  Semua
                </Link>
              </li>
              {kategoriTersedia.map((k) => (
                <li key={k}>
                  <Link
                    href={`/portofolio?kategori=${encodeURIComponent(k)}`}
                    aria-current={terpilih === k ? "true" : undefined}
                    className={cn(
                      "inline-flex min-h-[40px] items-center rounded border px-4 text-sm transition-colors duration-200",
                      terpilih === k
                        ? "border-transparent bg-primary text-on-primary"
                        : "border-border-strong text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {k}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-12">
          {proyek.length > 0 ? (
            <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {proyek.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={terpilih ? `Belum ada proyek di kategori "${terpilih}"` : "Belum ada proyek terbit"}
              description="Proyek yang berstatus terbit akan muncul di halaman ini."
            />
          )}
        </div>
      </div>
    </Container>
  );
}
