import { awalPekan, selisihHari, tambahHari, warnaProyek, type TugasBrief } from "@/lib/workspace-brief";
import type { WorkProject } from "@/lib/workspace-types";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const VW = 1000;
const LW = 156; // lebar kolom label proyek
const PR = 14;
const TOP = 46;
const LH = 66;

function potong(teks: string, maks: number): string {
  return teks.length > maks ? `${teks.slice(0, maks - 1)}…` : teks;
}

/** Bungkus teks jadi maksimal dua baris berdasarkan batas kata. */
function duaBaris(teks: string, maks: number): [string, string?] {
  if (teks.length <= maks) return [teks];
  const kata = teks.split(" ");
  let a = "";
  let i = 0;
  while (i < kata.length && (a + " " + kata[i]).trim().length <= maks) a = (a + " " + kata[i++]).trim();
  if (!a) return [potong(teks, maks)];
  return [a, potong(kata.slice(i).join(" "), maks)];
}

interface Kotak {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

function bentrok(a: Kotak, b: Kotak): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/**
 * Peta jadwal: satu lajur per proyek, satu penanda per tenggat. Dirender di
 * server sebagai SVG — tidak butuh JavaScript di klien. Belah ketupat = tenggat
 * keras, bulat = tenggat biasa, pudar = sudah selesai.
 */
export function BriefRunway({
  hariIni,
  proyek,
  tugas,
}: {
  hariIni: string;
  proyek: WorkProject[];
  tugas: TugasBrief[];
}) {
  const lajur = proyek.filter((p) => tugas.some((t) => t.proyekId === p.id));
  if (lajur.length === 0) return null;

  const semuaTanggal = [hariIni, ...tugas.map((t) => t.tanggal)].sort();
  const mulai = awalPekan(semuaTanggal[0]);
  const akhirTerakhir = semuaTanggal[semuaTanggal.length - 1];
  const akhir = tambahHari(awalPekan(akhirTerakhir), 6);
  const hari = selisihHari(mulai, akhir) + 1;
  const dw = (VW - LW - PR) / hari;
  const tinggiLajur = lajur.length * LH;
  const H = TOP + tinggiLajur + 10;
  const x = (tgl: string) => LW + selisihHari(mulai, tgl) * dw;

  const kolom = Array.from({ length: hari }, (_, i) => tambahHari(mulai, i));
  const akhirPekan = kolom.filter((_, i) => i % 7 >= 5);
  const senin = kolom.filter((_, i) => i % 7 === 0);
  const xHariIni = x(hariIni);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <svg
        viewBox={`0 0 ${VW} ${H}`}
        role="img"
        aria-label="Peta jadwal tenggat per proyek"
        className="block h-auto min-w-[760px] w-full"
      >
        {akhirPekan.map((d) => (
          <rect key={d} x={x(d)} y={TOP} width={dw} height={tinggiLajur} style={{ fill: "var(--muted)", opacity: 0.55 }} />
        ))}

        {/* kolom hari ini */}
        <rect x={xHariIni} y={TOP} width={dw} height={tinggiLajur} style={{ fill: "var(--amber)", opacity: 0.22 }} />

        {senin.map((d) => {
          const [, b, t] = d.split("-").map(Number);
          return (
            <g key={d}>
              <line x1={x(d)} x2={x(d)} y1={TOP - 12} y2={TOP + tinggiLajur} style={{ stroke: "var(--border)" }} />
              <text x={x(d) + 5} y={TOP - 16} fontSize={12} style={{ fill: "var(--subtle)" }}>
                {t} {BULAN[b - 1]}
              </text>
            </g>
          );
        })}

        <line
          x1={xHariIni + dw / 2}
          x2={xHariIni + dw / 2}
          y1={TOP - 12}
          y2={TOP + tinggiLajur}
          style={{ stroke: "var(--amber)", strokeWidth: 2 }}
        />
        <rect x={xHariIni + dw / 2 - 36} y={2} width={72} height={18} rx={3} style={{ fill: "var(--amber)" }} />
        <text x={xHariIni + dw / 2} y={15} textAnchor="middle" fontSize={11} fontWeight={700} style={{ fill: "#1a1200" }}>
          HARI INI
        </text>

        {lajur.map((p, i) => {
          const y0 = TOP + i * LH;
          const cy = y0 + LH / 2;
          const warna = warnaProyek(p.warna);
          const milik = tugas.filter((t) => t.proyekId === p.id);
          const perHari = new Map<string, TugasBrief[]>();
          for (const t of milik) perHari.set(t.tanggal, [...(perHari.get(t.tanggal) ?? []), t]);

          const titik = milik.map((t) => {
            const grup = perHari.get(t.tanggal) ?? [t];
            const j = grup.indexOf(t);
            return { t, cx: x(t.tanggal) + dw / 2, yy: cy + (j - (grup.length - 1) / 2) * 15 };
          });

          // Penempatan label tanpa tabrakan: tiap tenggat keras mencoba beberapa posisi
          // (kanan/kiri, sebaris/atas/bawah) dan memakai yang pertama tidak menimpa apa pun.
          const terisi: Kotak[] = titik.map(({ cx, yy }) => ({ x1: cx - 9, x2: cx + 9, y1: yy - 9, y2: yy + 9 }));
          const label = new Map<string, { x: number; y: number; kiri: boolean; teks: string }>();
          for (const { t, cx, yy } of titik) {
            if (t.prioritas !== "tinggi" || t.status === "done") continue;
            const teks = potong(t.judul, 22);
            const lebar = teks.length * 6.4;
            const kandidat = [
              { kiri: false, dy: 0 }, { kiri: true, dy: 0 },
              { kiri: false, dy: -17 }, { kiri: false, dy: 19 },
              { kiri: true, dy: -17 }, { kiri: true, dy: 19 },
            ];
            for (const k of kandidat) {
              const x1 = k.kiri ? cx - 12 - lebar : cx + 12;
              const kotak: Kotak = { x1, x2: x1 + lebar, y1: yy + k.dy - 9, y2: yy + k.dy + 5 };
              const dalam = kotak.x1 >= LW && kotak.x2 <= VW - PR && kotak.y1 >= y0 + 4 && kotak.y2 <= y0 + LH - 4;
              if (dalam && !terisi.some((o) => bentrok(o, kotak))) {
                terisi.push(kotak);
                label.set(t.id, { x: k.kiri ? cx - 12 : cx + 12, y: yy + k.dy + 4, kiri: k.kiri, teks });
                break;
              }
            }
          }

          const [baris1, baris2] = duaBaris(p.judul, 19);

          return (
            <g key={p.id}>
              <line x1={0} x2={VW - PR} y1={y0} y2={y0} style={{ stroke: "var(--border)" }} />
              <rect x={6} y={cy - 6} width={12} height={12} rx={2} style={{ fill: warna }} />
              <text x={24} y={baris2 ? cy - 2 : cy + 4} fontSize={13} fontWeight={600} style={{ fill: "var(--foreground)" }}>
                {baris1}
              </text>
              {baris2 ? (
                <text x={24} y={cy + 13} fontSize={13} fontWeight={600} style={{ fill: "var(--foreground)" }}>
                  {baris2}
                </text>
              ) : null}

              {titik.map(({ t, cx, yy }) => {
                const keras = t.prioritas === "tinggi";
                const selesai = t.status === "done";
                const telat = !selesai && t.selisih < 0;
                const isi = telat ? "var(--destructive)" : warna;
                const lb = label.get(t.id);
                return (
                  <g key={t.id} opacity={selesai ? 0.35 : 1}>
                    <title>{`${t.tanggal}: ${t.judul}`}</title>
                    {keras ? (
                      <rect x={cx - 6.5} y={yy - 6.5} width={13} height={13} transform={`rotate(45 ${cx} ${yy})`} style={{ fill: isi }} />
                    ) : (
                      <circle cx={cx} cy={yy} r={4.5} style={{ fill: isi }} />
                    )}
                    {lb ? (
                      <text x={lb.x} y={lb.y} fontSize={11.5} fontWeight={600} textAnchor={lb.kiri ? "end" : "start"} style={{ fill: "var(--foreground)" }}>
                        {lb.teks}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          );
        })}
        <line x1={0} x2={VW - PR} y1={TOP + tinggiLajur} y2={TOP + tinggiLajur} style={{ stroke: "var(--border)" }} />
      </svg>
    </div>
  );
}
