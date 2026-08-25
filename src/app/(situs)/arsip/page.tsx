import type { Metadata } from "next";
import { Container, EmptyState, Badge } from "@/components/ui/primitives";
import { ArchiveCard } from "@/components/cards";
import { sesiAman } from "@/lib/auth";
import { getArchiveCollections, getArchiveItemCounts } from "@/lib/queries";
import { LEVEL_LABEL, type StudyLevel } from "@/lib/types";

export const metadata: Metadata = {
  title: "Arsip Kuliah",
  description:
    "Slide, catatan, bank soal, dan modul praktikum Teknik Sipil UGM jenjang S1 dan S2.",
};

const URUTAN_JENJANG: StudyLevel[] = ["s1", "s2", "umum", "penelitian"];

export default async function DaftarArsip() {
  const [session, koleksi, jumlah] = await Promise.all([
    sesiAman(),
    getArchiveCollections(),
    getArchiveItemCounts(),
  ]);

  const perJenjang = new Map<StudyLevel, typeof koleksi>();
  for (const k of koleksi) {
    const list = perJenjang.get(k.level) ?? [];
    list.push(k);
    perJenjang.set(k.level, list);
  }

  return (
    <Container size="wide">
      <div className="py-16 sm:py-24">
        <p className="eyebrow">Arsip Kuliah</p>
        <h1 className="display-lg mt-4 max-w-3xl">Materi S1 &amp; S2 Teknik Sipil</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Kumpulan slide, catatan, bank soal, dan modul praktikum yang saya
          rapikan selama kuliah. Daftarnya terbuka untuk siapa saja; unduhannya
          terbuka untuk sesama mahasiswa UGM.
        </p>

        {session?.user?.isUgm ? (
          <p className="mt-6 inline-flex items-center gap-2">
            <Badge tone="success">Terverifikasi</Badge>
            <span className="text-sm text-muted-foreground">
              Masuk sebagai {session.user.email} — unduhan terbuka.
            </span>
          </p>
        ) : null}

        <div className="mt-14 flex flex-col gap-16">
          {koleksi.length === 0 ? (
            <EmptyState
              title="Arsip belum diisi"
              description="Tambahkan mata kuliah dan berkasnya lewat panel admin."
            />
          ) : null}

          {URUTAN_JENJANG.map((jenjang) => {
            const list = perJenjang.get(jenjang);
            if (!list || list.length === 0) return null;

            return (
              <section key={jenjang}>
                <div className="flex items-baseline gap-3">
                  <h2 className="font-display text-2xl font-semibold">
                    {LEVEL_LABEL[jenjang]}
                  </h2>
                  <span className="text-sm text-subtle">{list.length} mata kuliah</span>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((k) => (
                    <ArchiveCard
                      key={k.id}
                      collection={k}
                      jumlahBerkas={jumlah[k.id] ?? 0}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
