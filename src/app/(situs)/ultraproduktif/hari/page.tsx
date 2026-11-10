import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, EmptyState } from "@/components/ui/primitives";
import { HariTimeline } from "@/components/kerja/hari-timeline";
import { acaraRentang, kalenderBacaIds } from "@/lib/calendar";
import { awalPekan, tambahHari, warnaProyek } from "@/lib/workspace-brief";
import { susunHari, tanggalValid } from "@/lib/workspace-hari";
import { listProjects, listSchedule, listTasks, workspaceSheetsConfigured } from "@/lib/workspace-sheets";
import { formatTanggalLokal, hariIniWIB, sekarangWIB } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Jadwal per hari" };

const HARI_PENDEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default async function HariPage({ searchParams }: { searchParams: Promise<{ tgl?: string }> }) {
  const { tgl } = await searchParams;
  const hariIni = hariIniWIB();
  const tanggal = tanggalValid(tgl) ? tgl : hariIni;

  if (!workspaceSheetsConfigured()) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="display-lg">Jadwal per hari</h1>
        <EmptyState
          title="Sheets belum disetel"
          description="Halaman ini membaca data dari spreadsheet Ultraproduktif. Isi GOOGLE_SHEETS_KERJA_ID dulu (lihat README bagian 10)."
        />
      </div>
    );
  }

  const [proyek, jadwal, tugas, luar] = await Promise.all([
    listProjects(),
    listSchedule(),
    listTasks(),
    acaraRentang(tambahHari(tanggal, -1), tambahHari(tanggal, 2)),
  ]);

  const data = susunHari({
    tanggal,
    proyek,
    tugas,
    jadwal,
    acara: luar.acara,
    warnaProyek,
    warnaKalender: "var(--k-netral)",
  });

  const adaKalenderBaca = kalenderBacaIds().length > 0;
  const sekarangMenit =
    tanggal === hariIni ? Number(sekarangWIB().slice(11, 13)) * 60 + Number(sekarangWIB().slice(14, 16)) : null;

  const awalMinggu = awalPekan(tanggal);
  const minggu = Array.from({ length: 7 }, (_, i) => tambahHari(awalMinggu, i));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{tanggal === hariIni ? "Hari ini" : "Jadwal per hari"}</p>
          <h1 className="display-lg mt-1">{formatTanggalLokal(tanggal)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.hitung.acara} acara · {data.hitung.tenggat} tenggat tugas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/ultraproduktif/hari?tgl=${tambahHari(tanggal, -1)}`}
            aria-label="Hari sebelumnya"
            className="inline-flex size-10 items-center justify-center rounded border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link
            href="/ultraproduktif/hari"
            className={cn(
              "inline-flex min-h-[40px] items-center rounded border border-border px-3 text-sm transition-colors duration-200 hover:bg-muted",
              tanggal === hariIni ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            Hari ini
          </Link>
          <Link
            href={`/ultraproduktif/hari?tgl=${tambahHari(tanggal, 1)}`}
            aria-label="Hari berikutnya"
            className="inline-flex size-10 items-center justify-center rounded border border-border text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="tgl" className="sr-only">
              Pilih tanggal
            </label>
            <input
              id="tgl"
              name="tgl"
              type="date"
              defaultValue={tanggal}
              required
              className="min-h-[40px] rounded border border-border bg-background px-2 text-sm"
            />
            <Button type="submit" variant="outline" size="sm">
              Buka
            </Button>
          </form>
        </div>
      </div>

      <nav aria-label="Pekan ini" className="grid grid-cols-7 gap-1.5">
        {minggu.map((t, i) => {
          const dipilih = t === tanggal;
          return (
            <Link
              key={t}
              href={t === hariIni ? "/ultraproduktif/hari" : `/ultraproduktif/hari?tgl=${t}`}
              aria-current={dipilih ? "date" : undefined}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center rounded-lg border text-center transition-colors duration-200",
                dipilih ? "border-foreground bg-foreground text-background" : "border-border bg-surface hover:bg-muted",
              )}
            >
              <span className={cn("text-[11px]", dipilih ? "text-background/80" : "text-subtle")}>{HARI_PENDEK[i]}</span>
              <span className="font-mono text-base font-semibold tabular-nums">{Number(t.slice(8, 10))}</span>
              {t === hariIni ? (
                <span className={cn("mt-0.5 size-1.5 rounded-full", dipilih ? "bg-background" : "bg-destructive")} aria-label="Hari ini" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!adaKalenderBaca ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
          Jadwal kuliah dari Google Calendar belum tersambung, jadi yang tampil baru tab Jadwal dan tenggat tugas. Bagikan kalender
          kuliah ke service account (izin &quot;Lihat semua detail acara&quot;), lalu isi <code>GOOGLE_CALENDAR_READ_IDS</code>.
          Langkahnya ada di README §10.6.
        </p>
      ) : null}
      {luar.galat.length > 0 ? (
        <p className="rounded-lg border border-destructive/40 bg-surface p-4 text-sm text-destructive">
          Gagal membaca kalender: {luar.galat.join(", ")}. Pastikan kalender dibagikan ke service account.
        </p>
      ) : null}

      <HariTimeline data={data} sekarangMenit={sekarangMenit} />

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
        <span className="flex items-center gap-1.5">
          <Badge tone="neutral">Kalender</Badge> kuliah dan acara
        </span>
        <span className="flex items-center gap-1.5">
          <Badge tone="accent">Jadwal</Badge> dari tab Jadwal
        </span>
        <span>◆ tenggat tugas (garis putus-putus)</span>
        <span>Warna blok = warna proyek</span>
      </p>
    </div>
  );
}
