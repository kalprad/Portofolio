import Link from "next/link";
import { MapPin } from "lucide-react";
import type { BlokHari, HariData, TanpaJam } from "@/lib/workspace-hari";
import { cn } from "@/lib/utils";

const TINGGI_JAM = 64; // px per jam
const TINGGI_MIN = 28; // px, tinggi minimum blok

function jamLabel(j: number): string {
  return `${String(j).padStart(2, "0")}.00`;
}

function Penanda({ jenis }: { jenis: BlokHari["jenis"] }) {
  if (jenis === "tugas") return <span aria-hidden>◆ </span>;
  return null;
}

function isiBlok(b: BlokHari, tinggi: number) {
  // Blok pendek (mis. tenggat satu titik waktu) muat satu baris saja: judul lalu jam.
  if (tinggi < 46) {
    return (
      <p className={cn("flex items-baseline gap-2 text-[13px] leading-tight", b.selesaiTugas && "line-through opacity-70")}>
        <span className="min-w-0 flex-1 truncate font-semibold">
          <Penanda jenis={b.jenis} />
          {b.judul}
        </span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{b.jam}</span>
      </p>
    );
  }
  const pendek = b.selesai - b.mulai <= 45 || b.jumlahKolom > 2;
  return (
    <>
      <p className={cn("text-[13px] font-semibold leading-tight", b.selesaiTugas && "line-through opacity-70")}>
        <Penanda jenis={b.jenis} />
        {b.judul}
      </p>
      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
        {b.jam}
        {b.jenis === "tugas" ? " · tenggat" : ""}
      </p>
      {!pendek && b.lokasi ? (
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{b.lokasi}</span>
        </p>
      ) : null}
      {!pendek && b.ket ? <p className="mt-0.5 truncate text-[11px] text-subtle">{b.ket}</p> : null}
    </>
  );
}

function KotakBlok({ b, awalMenit }: { b: BlokHari; awalMenit: number }) {
  const top = ((b.mulai - awalMenit) / 60) * TINGGI_JAM;
  const tinggi = Math.max(((b.selesai - b.mulai) / 60) * TINGGI_JAM - 2, TINGGI_MIN);
  const lebar = 100 / b.jumlahKolom;
  const tugas = b.jenis === "tugas";

  const gaya: React.CSSProperties = {
    top,
    height: tinggi,
    left: `calc(${b.kolom * lebar}% + 2px)`,
    width: `calc(${lebar}% - 4px)`,
    borderLeft: `4px solid ${b.warna}`,
    background: `color-mix(in srgb, ${b.warna} ${tugas ? 8 : 14}%, var(--background))`,
    borderTop: tugas ? `1px dashed ${b.warna}` : undefined,
    borderRight: tugas ? `1px dashed ${b.warna}` : undefined,
    borderBottom: tugas ? `1px dashed ${b.warna}` : undefined,
  };
  const kelas = cn(
    "absolute overflow-hidden rounded-md px-2 py-1 text-foreground transition-shadow duration-200 hover:z-10 hover:shadow-md",
    b.selesaiTugas && "opacity-60",
  );
  const judulAria = `${b.judul}, ${b.jam}${b.lokasi ? `, ${b.lokasi}` : ""}`;

  if (b.proyekId) {
    return (
      <Link href={`/ultraproduktif/proyek/${b.proyekId}`} className={kelas} style={gaya} aria-label={judulAria}>
        {isiBlok(b, tinggi)}
      </Link>
    );
  }
  return (
    <div className={kelas} style={gaya} role="group" aria-label={judulAria}>
      {isiBlok(b, tinggi)}
    </div>
  );
}

function BarisTanpaJam({ t }: { t: TanpaJam }) {
  const isi = (
    <>
      <span className="size-2 shrink-0 rounded-full" style={{ background: t.warna }} aria-hidden />
      <span className={cn("text-sm font-medium", t.selesaiTugas && "line-through opacity-60")}>{t.judul}</span>
      <span className="text-xs text-subtle">
        {t.jenis === "tugas" ? "Tenggat tanpa jam" : "Seharian"}
        {t.ket ? ` · ${t.ket}` : ""}
      </span>
    </>
  );
  const kelas = "flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border px-3 py-2 first:border-t-0";
  return (
    <li>
      {t.proyekId ? (
        <Link href={`/ultraproduktif/proyek/${t.proyekId}`} className={cn(kelas, "hover:bg-muted")}>
          {isi}
        </Link>
      ) : (
        <div className={kelas}>{isi}</div>
      )}
    </li>
  );
}

/**
 * Lini masa satu hari, satu baris per jam. Dirender di server — tanpa
 * JavaScript di klien. `sekarangMenit` diisi hanya kalau hari yang ditampilkan
 * adalah hari ini, untuk menggambar garis "sekarang".
 */
export function HariTimeline({ data, sekarangMenit }: { data: HariData; sekarangMenit: number | null }) {
  const { jamAwal, jamAkhir, blok, tanpaJam } = data;
  const awalMenit = jamAwal * 60;
  const jamList = Array.from({ length: jamAkhir - jamAwal }, (_, i) => jamAwal + i);
  const tinggiTotal = jamList.length * TINGGI_JAM;
  const tampilkanSekarang =
    sekarangMenit !== null && sekarangMenit >= awalMenit && sekarangMenit <= jamAkhir * 60;

  return (
    <div className="flex flex-col gap-4">
      {tanpaJam.length > 0 ? (
        <section aria-label="Tanpa jam tertentu">
          <h2 className="eyebrow mb-2">Seharian / tanpa jam</h2>
          <ul className="rounded-lg border border-border bg-surface">
            {tanpaJam.map((t) => (
              <BarisTanpaJam key={t.key} t={t} />
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Lini masa per jam" className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex">
          <div className="w-14 shrink-0 border-r border-border sm:w-16" aria-hidden>
            {jamList.map((j, i) => (
              <div key={j} className="relative" style={{ height: TINGGI_JAM }}>
                {i > 0 ? (
                  <span className="absolute -top-2 right-2 bg-surface px-0.5 font-mono text-[11px] tabular-nums text-subtle">
                    {jamLabel(j)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <div className="relative min-w-0 flex-1" style={{ height: tinggiTotal }}>
            {jamList.map((j, i) => (
              <div
                key={j}
                className="absolute inset-x-0 border-t border-border"
                style={{ top: i * TINGGI_JAM }}
                aria-hidden
              >
                <div className="absolute inset-x-0 border-t border-dashed border-border/50" style={{ top: TINGGI_JAM / 2 }} />
              </div>
            ))}

            {blok.map((b) => (
              <KotakBlok key={b.key} b={b} awalMenit={awalMenit} />
            ))}

            {tampilkanSekarang ? (
              <div
                className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                style={{ top: ((sekarangMenit - awalMenit) / 60) * TINGGI_JAM }}
                aria-hidden
              >
                <span className="size-2 -translate-x-1 rounded-full bg-destructive" />
                <span className="h-px flex-1 bg-destructive" />
              </div>
            ) : null}

            {blok.length === 0 ? (
              <p className="absolute inset-x-0 top-6 text-center text-sm text-subtle">
                Tidak ada jadwal atau tenggat berjam pada hari ini.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
