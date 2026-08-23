import type { Metadata } from "next";
import Link from "next/link";
import { Container, EmptyState } from "@/components/ui/primitives";
import { PostCard } from "@/components/cards";
import { getPosts } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tulisan",
  description: "Catatan teknik, proses riset, dan tulisan personal.",
};

export default async function DaftarTulisan({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const semua = await getPosts();

  const kategoriTersedia = Array.from(
    new Set(semua.map((p) => p.category).filter(Boolean) as string[]),
  );
  const terpilih = kategori && kategoriTersedia.includes(kategori) ? kategori : null;
  const tulisan = terpilih ? semua.filter((p) => p.category === terpilih) : semua;

  return (
    <Container size="default">
      <div className="py-16 sm:py-24">
        <p className="eyebrow">Tulisan</p>
        <h1 className="display-lg mt-4">Catatan &amp; curhatan</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Sebagian tentang struktur dan riset, sebagian tentang hal-hal yang
          tidak muat di laporan.
        </p>

        {kategoriTersedia.length > 1 ? (
          <nav aria-label="Saring menurut kategori" className="mt-10">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href="/tulisan"
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
                    href={`/tulisan?kategori=${encodeURIComponent(k)}`}
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

        <div className="mt-10">
          {tulisan.length > 0 ? (
            tulisan.map((t) => <PostCard key={t.id} post={t} />)
          ) : (
            <EmptyState
              title="Belum ada tulisan terbit"
              description="Tulisan berstatus publik akan tampil di sini. Yang berstatus tak terdaftar hanya bisa dibuka lewat tautan langsung."
            />
          )}
        </div>
      </div>
    </Container>
  );
}
