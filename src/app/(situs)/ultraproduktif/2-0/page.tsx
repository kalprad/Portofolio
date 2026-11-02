import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, ChevronDown, Upload } from "lucide-react";
import { Badge, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { BriefRunway } from "@/components/kerja/brief-runway";
import { TombolSelesai } from "@/components/kerja/tombol-selesai";
import { listProjects, listSchedule, listTasks, workspaceSheetsConfigured } from "@/lib/workspace-sheets";
import { labelHitungMundur, susunBrief, warnaProyek, type TugasBrief } from "@/lib/workspace-brief";
import { formatTanggalLokal, hariIniWIB } from "@/lib/workspace-utils";
import type { WorkProject } from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ultraproduktif 2.0" };

const GRID_BP = {
  backgroundColor: "var(--bp)",
  backgroundImage:
    "linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px)",
  backgroundSize: "24px 24px",
  color: "var(--bp-ink)",
} as const;

function jamDari(tenggat: string | null): string {
  const jam = tenggat?.slice(11, 16);
  return jam && jam !== "00:00" ? jam.replace(":", ".") : "";
}

function Hitung({ t }: { t: TugasBrief }) {
  const tone = t.selisih < 0 ? "danger" : t.selisih <= 1 ? "warning" : t.selisih <= 7 ? "accent" : "neutral";
  return <Badge tone={tone}>{labelHitungMundur(t.selisih)}</Badge>;
}

function KartuFokus({ t, no, warna }: { t: TugasBrief; no: number; warna: string }) {
  const genting = t.selisih <= 1;
  const jam = jamDari(t.tenggat);
  return (
    <li
      className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 sm:p-5"
      style={{ borderLeft: `6px solid ${warna}` }}
    >
      <span className="font-mono text-3xl font-semibold tabular-nums text-subtle" aria-hidden>
        {no}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold leading-snug sm:text-lg">{t.judul}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium" style={{ color: warna }}>
            {t.proyekJudul}
          </span>
          {" · "}
          {formatTanggalLokal(t.tenggat)}
          {jam ? ` · ${jam}` : ""}
        </p>
        {t.deskripsi ? <p className="mt-1 line-clamp-2 text-sm text-subtle">{t.deskripsi}</p> : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={cn("font-mono text-xl font-semibold tabular-nums", genting ? "text-destructive" : "text-foreground")}>
          {labelHitungMundur(t.selisih)}
        </span>
        <TombolSelesai id={t.id} proyekId={t.proyekId} urutan={t.urutan} />
      </div>
    </li>
  );
}

function BarisPekan({ t, warna }: { t: TugasBrief; warna: string }) {
  const jam = jamDari(t.tenggat);
  return (
    <li className="flex items-center gap-3 border-t border-border p-3 first:border-t-0 sm:p-4" style={{ borderLeft: `4px solid ${warna}` }}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t.judul}</p>
        <p className="text-xs text-subtle">
          {formatTanggalLokal(t.tenggat)}
          {jam ? ` · ${jam}` : ""} · {t.proyekJudul}
        </p>
      </div>
      {t.prioritas === "tinggi" ? <Badge tone="danger">Keras</Badge> : null}
      <Hitung t={t} />
      <TombolSelesai id={t.id} proyekId={t.proyekId} urutan={t.urutan} />
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
  const warnaDari = new Map<string, string>(proyek.map((p: WorkProject) => [p.id, warnaProyek(p.warna)]));
  const w = (id: string) => warnaDari.get(id) ?? warnaProyek(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">{formatTanggalLokal(hariIni)}</p>
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
          {/* 1. Cetak biru: satu hal terpenting, besar */}
          <section className="relative overflow-hidden rounded-xl p-6 sm:p-10" style={GRID_BP}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider">
              <span className="rounded px-2 py-1" style={{ background: "var(--amber)", color: "#1a1200" }}>
                BERIKUTNYA
              </span>
              {b.hitung.terlambat > 0 ? (
                <span className="rounded bg-destructive px-2 py-1 text-on-destructive">{b.hitung.terlambat} TERLAMBAT</span>
              ) : null}
              <span style={{ color: "var(--bp-dim)" }}>{b.hitung.sepekan} TENGGAT DALAM 7 HARI</span>
            </div>

            {b.hero ? (
              <div className="mt-6 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
                <div className="min-w-0 max-w-2xl">
                  <h1 className="font-display text-3xl font-semibold leading-tight sm:text-5xl" style={{ color: "var(--bp-ink)" }}>
                    {b.hero.judul}
                  </h1>
                  <p className="mt-3 text-sm sm:text-base" style={{ color: "var(--bp-dim)" }}>
                    {formatTanggalLokal(b.hero.tenggat)}
                    {jamDari(b.hero.tenggat) ? ` · ${jamDari(b.hero.tenggat)}` : ""} · {b.hero.proyekJudul}
                  </p>
                </div>
                <p className="font-mono text-6xl font-semibold tabular-nums sm:text-8xl" style={{ color: "var(--amber)" }}>
                  {labelHitungMundur(b.hero.selisih)}
                </p>
              </div>
            ) : (
              <p className="mt-6 font-display text-3xl font-semibold sm:text-5xl">Tidak ada tenggat terbuka.</p>
            )}

            {b.keras.length > 0 ? (
              <ul className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {b.keras.map((t) => (
                  <li key={t.id} className="rounded-md p-3" style={{ background: "var(--bp-l1, rgba(255,255,255,.08))", border: "1px solid rgba(255,255,255,.16)" }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--bp-dim)" }}>
                      <span className="size-2 rounded-full" style={{ background: w(t.proyekId), outline: "1px solid rgba(255,255,255,.5)" }} aria-hidden />
                      {labelHitungMundur(t.selisih)}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium">{t.judul}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* 2. Kerjakan dulu: maksimal tiga */}
          <section>
            <h2 className="eyebrow mb-3">Kerjakan dulu · maksimal 3</h2>
            {b.fokus.length === 0 ? (
              <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">Tidak ada yang mendesak. Cek peta di bawah.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {b.fokus.map((t, i) => (
                  <KartuFokus key={t.id} t={t} no={i + 1} warna={w(t.proyekId)} />
                ))}
              </ol>
            )}
            {b.hariIniJadwal.length > 0 ? (
              <ul className="mt-3 rounded-lg border border-border">
                {b.hariIniJadwal.map((j) => (
                  <li key={j.id} className="flex items-center gap-3 border-t border-border p-3 first:border-t-0">
                    <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="font-mono text-sm tabular-nums">{j.mulai.slice(11, 16).replace(":", ".")}</span>
                    <span className="text-sm font-medium">{j.judul}</span>
                    {j.lokasi ? <span className="text-xs text-subtle">{j.lokasi}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* 3. Peta jadwal */}
          <section>
            <h2 className="eyebrow mb-3">Peta jadwal</h2>
            <BriefRunway hariIni={hariIni} proyek={proyek.filter((p) => p.status === "aktif")} tugas={b.semua} />
            <p className="mt-2 text-xs text-subtle">◆ tenggat keras · ● tenggat biasa · pudar = selesai · merah = terlambat. Geser ke samping di layar kecil.</p>
          </section>

          {/* 4. Per pekan: dua pekan pertama terbuka, sisanya dilipat */}
          <section>
            <h2 className="eyebrow mb-3">Per pekan</h2>
            <div className="flex flex-col gap-3">
              {b.pekan.map((p, i) => {
                const isi =
                  p.tugas.length === 0 ? (
                    <p className="p-4 text-sm text-subtle">Kosong.</p>
                  ) : (
                    <ul>
                      {p.tugas.map((t) => (
                        <BarisPekan key={t.id} t={t} warna={w(t.proyekId)} />
                      ))}
                    </ul>
                  );
                return (
                  <details key={p.mulai} open={i < 2 && p.tugas.length > 0} className="group rounded-lg border border-border bg-surface">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                      <span className="flex items-baseline gap-2">
                        <span className="font-semibold">{p.label}</span>
                        <span className="text-xs text-subtle">mulai {formatTanggalLokal(p.mulai)}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge tone={p.tugas.length > 0 ? "accent" : "neutral"}>{p.tugas.length} tugas</Badge>
                        <ChevronDown className="size-4 text-subtle transition-transform duration-200 group-open:rotate-180" aria-hidden />
                      </span>
                    </summary>
                    <div className="border-t border-border">{isi}</div>
                  </details>
                );
              })}
            </div>
          </section>

          {/* 5. Proyek */}
          <section>
            <h2 className="eyebrow mb-3">Proyek</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {b.proyek.map(({ proyek: p, total, selesai, berikutnya }) => {
                const persen = total === 0 ? 0 : Math.round((selesai / total) * 100);
                const warna = warnaProyek(p.warna);
                return (
                  <Link
                    key={p.id}
                    href={`/ultraproduktif/proyek/${p.id}`}
                    className="rounded-lg border border-border bg-surface p-5 transition-colors duration-200 hover:bg-muted"
                    style={{ borderTop: `5px solid ${warna}` }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{p.judul}</p>
                      <span className="font-mono text-sm tabular-nums text-subtle">
                        {selesai}/{total}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={persen} aria-valuemin={0} aria-valuemax={100} aria-label={`Kemajuan ${p.judul}`}>
                      <div className="h-full rounded-full" style={{ width: `${persen}%`, background: warna }} />
                    </div>
                    {berikutnya ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        <span className={cn("font-semibold", berikutnya.selisih <= 1 ? "text-destructive" : "text-foreground")}>
                          {labelHitungMundur(berikutnya.selisih)}
                        </span>{" "}
                        · {berikutnya.judul}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-subtle">Tidak ada tenggat terbuka.</p>
                    )}
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
