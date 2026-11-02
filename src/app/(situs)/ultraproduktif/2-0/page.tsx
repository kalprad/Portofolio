import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, ArrowRight, CalendarClock, Upload } from "lucide-react";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { listProjects, listSchedule, listTasks, workspaceSheetsConfigured } from "@/lib/workspace-sheets";
import { susunBrief, labelHitungMundur, type TugasBrief } from "@/lib/workspace-brief";
import { formatTanggalLokal, formatWaktuLokal, hariIniWIB } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ultraproduktif 2.0" };

function jamDari(tenggat: string | null): string {
  if (!tenggat) return "";
  const jam = tenggat.slice(11, 16);
  return jam && jam !== "00:00" ? jam.replace(":", ".") : "";
}

function Hitung({ t }: { t: TugasBrief }) {
  const tone = t.selisih < 0 ? "danger" : t.selisih <= 1 ? "warning" : t.selisih <= 7 ? "accent" : "neutral";
  return <Badge tone={tone}>{labelHitungMundur(t.selisih)}</Badge>;
}

function BarisTugas({ t }: { t: TugasBrief }) {
  const jam = jamDari(t.tenggat);
  return (
    <li className="flex items-start justify-between gap-3 border-t border-border p-4 first:border-t-0">
      <div className="min-w-0">
        <Link href={`/ultraproduktif/proyek/${t.proyekId}`} className="text-sm font-medium hover:text-accent">
          {t.judul}
        </Link>
        <p className="mt-0.5 text-xs text-subtle">
          {formatTanggalLokal(t.tenggat)}
          {jam ? ` · ${jam}` : ""} · {t.proyekJudul}
        </p>
        {t.deskripsi ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.deskripsi}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {t.prioritas === "tinggi" ? <Badge tone="danger">Keras</Badge> : null}
        <Hitung t={t} />
      </div>
    </li>
  );
}

export default async function Ultraproduktif20Page() {
  if (!workspaceSheetsConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="display-lg">Ultraproduktif 2.0</h1>
        <EmptyState
          title="Sheets belum disetel"
          description="Halaman ini membaca data dari spreadsheet Ultraproduktif. Isi GOOGLE_SHEETS_KERJA_ID dulu (lihat README bagian 10)."
        />
      </div>
    );
  }

  const proyek = await listProjects();
  const [jadwal, tugas] = await Promise.all([
    listSchedule(),
    Promise.all(proyek.map((p) => listTasks(p.id))).then((r) => r.flat()),
  ]);

  const hariIni = hariIniWIB();
  const b = susunBrief(hariIni, proyek, tugas, jadwal);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{formatTanggalLokal(hariIni)}</p>
          <h1 className="display-lg mt-1">Ultraproduktif 2.0</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">Brief harian: apa yang mendesak, apa yang datang, dan di mana tiap proyek berdiri.</p>
        </div>
        <ButtonLink href="/ultraproduktif/2-0/impor" variant="outline" size="sm">
          <Upload className="size-4" aria-hidden />
          Impor data
        </ButtonLink>
      </div>

      {proyek.length === 0 ? (
        <EmptyState
          title="Belum ada data"
          description="Tambah proyek dari Ringkasan, atau impor dari berkas JSON brief lewat tombol Impor data."
        />
      ) : (
        <>
          {/* Hero: tenggat keras terdekat */}
          {b.hero ? (
            <section className="rounded border border-border bg-surface p-6 sm:p-8">
              <p className="eyebrow">Berikutnya</p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0">
                  <p className="text-2xl font-medium leading-snug sm:text-3xl">{b.hero.judul}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatWaktuLokal(b.hero.tenggat)} · {b.hero.proyekJudul}
                  </p>
                  {b.hero.deskripsi ? <p className="mt-3 max-w-xl text-sm text-muted-foreground">{b.hero.deskripsi}</p> : null}
                </div>
                <p
                  className={cn(
                    "font-mono text-5xl font-medium tabular-nums sm:text-6xl",
                    b.hero.selisih <= 1 ? "text-destructive" : "text-accent",
                  )}
                >
                  {labelHitungMundur(b.hero.selisih)}
                </p>
              </div>
            </section>
          ) : null}

          {/* Angka ringkas */}
          <section className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-4">
            {[
              { label: "Terbuka", nilai: b.hitung.terbuka, tone: "" },
              { label: "7 hari ke depan", nilai: b.hitung.sepekan, tone: "text-accent" },
              { label: "Terlambat", nilai: b.hitung.terlambat, tone: b.hitung.terlambat > 0 ? "text-destructive" : "" },
              { label: "Selesai", nilai: b.hitung.selesai, tone: "text-success" },
            ].map((s) => (
              <div key={s.label} className="bg-background p-5">
                <p className="eyebrow">{s.label}</p>
                <p className={cn("mt-2 font-mono text-3xl font-medium tabular-nums", s.tone)}>{s.nilai}</p>
              </div>
            ))}
          </section>

          {/* Terlambat */}
          {b.terlambat.length > 0 ? (
            <section>
              <h2 className="eyebrow mb-3 flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4" aria-hidden /> Terlambat
              </h2>
              <ul className="rounded border border-destructive/40">
                {b.terlambat.map((t) => (
                  <BarisTugas key={t.id} t={t} />
                ))}
              </ul>
            </section>
          ) : null}

          {/* Hari ini */}
          <section>
            <h2 className="eyebrow mb-3">Hari ini</h2>
            {b.hariIniTugas.length === 0 && b.hariIniJadwal.length === 0 ? (
              <p className="rounded border border-border p-5 text-sm text-muted-foreground">Tidak ada tenggat atau jadwal tercatat hari ini.</p>
            ) : (
              <ul className="rounded border border-border">
                {b.hariIniJadwal.map((j) => (
                  <li key={j.id} className="flex items-start gap-3 border-t border-border p-4 first:border-t-0">
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{j.judul}</p>
                      <p className="text-xs text-subtle">
                        {j.mulai.slice(11, 16).replace(":", ".")}
                        {j.selesai ? `–${j.selesai.slice(11, 16).replace(":", ".")}` : ""}
                        {j.lokasi ? ` · ${j.lokasi}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                {b.hariIniTugas.map((t) => (
                  <BarisTugas key={t.id} t={t} />
                ))}
              </ul>
            )}
          </section>

          {/* Landasan lima pekan */}
          <section>
            <h2 className="eyebrow mb-3">Lima pekan ke depan</h2>
            <div className="flex flex-col gap-6">
              {b.pekan.map((p) => (
                <div key={p.mulai}>
                  <p className="mb-2 flex items-baseline gap-2 text-sm">
                    <span className="font-medium">{p.label}</span>
                    <span className="text-xs text-subtle">mulai {formatTanggalLokal(p.mulai)}</span>
                  </p>
                  {p.tugas.length === 0 ? (
                    <p className="rounded border border-dashed border-border p-4 text-sm text-subtle">Kosong.</p>
                  ) : (
                    <ul className="rounded border border-border">
                      {p.tugas.map((t) => (
                        <BarisTugas key={t.id} t={t} />
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Proyek */}
          <section>
            <h2 className="eyebrow mb-3">Proyek</h2>
            <div className="grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
              {b.proyek.map(({ proyek: p, total, selesai, berikutnya }) => {
                const persen = total === 0 ? 0 : Math.round((selesai / total) * 100);
                return (
                  <Link key={p.id} href={`/ultraproduktif/proyek/${p.id}`} className="group bg-background p-5 transition-colors duration-200 hover:bg-muted">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{p.judul}</p>
                      <ArrowRight className="size-4 shrink-0 text-subtle transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100} aria-label={`Kemajuan ${p.judul}`}>
                      <div className="h-full rounded-full bg-accent" style={{ width: `${persen}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-subtle">
                      {selesai}/{total} langkah selesai
                    </p>
                    {berikutnya ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        <span className="text-foreground">{labelHitungMundur(berikutnya.selisih)}</span> · {berikutnya.judul}
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
