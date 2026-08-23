import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge, EmptyState, ButtonLink } from "@/components/ui/primitives";
import { getAccessLog, isLoggingConfigured } from "@/lib/queries";
import { sheetUrl } from "@/lib/sheets";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = { title: "Jejak akses" };

const NADA: Record<string, "success" | "warning" | "danger"> = {
  ok: "success",
  ditolak: "warning",
  gagal: "danger",
};

const LABEL_HASIL: Record<string, string> = {
  ok: "Berhasil",
  ditolak: "Ditolak",
  gagal: "Gagal",
};

function waktuLengkap(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export default async function JejakAkses() {
  const aktif = isLoggingConfigured();
  const jejak = await getAccessLog(200);
  const urlSheet = sheetUrl();

  const pengunduhUnik = new Set(
    jejak.filter((j) => j.hasil === "ok").map((j) => j.email || "?"),
  ).size;
  const ditolak = jejak.filter((j) => j.hasil === "ditolak").length;

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        judul="Jejak akses"
        keterangan="Setiap percobaan mengunduh berkas arsip tercatat sebagai satu baris di Google Sheets — berhasil maupun ditolak. Alamat IP disimpan sebagai hash, bukan nilai aslinya."
      />

      {!aktif ? (
        <div className="rounded border border-dashed border-border-strong bg-surface p-6">
          <p className="font-medium text-warning">Pencatatan belum aktif</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Jejak akses disimpan di Google Sheets, bukan di repositori — satu
            unduhan berarti satu tulisan baru, dan itu tidak cocok disimpan
            sebagai commit. Untuk menyalakannya: buat satu spreadsheet, bagikan
            ke alamat service account sebagai Editor, lalu isi{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GOOGLE_SHEETS_LOG_ID</code>{" "}
            dengan ID spreadsheet itu. Langkah lengkapnya ada di README bagian
            Jejak akses.
          </p>
        </div>
      ) : null}

      {aktif ? (
        <>
          <div className="grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-3">
            <div className="bg-background p-5">
              <p className="eyebrow">Total catatan</p>
              <p className="mt-2 font-display text-3xl tabular-nums">{formatCount(jejak.length)}</p>
            </div>
            <div className="bg-background p-5">
              <p className="eyebrow">Pengunduh unik</p>
              <p className="mt-2 font-display text-3xl tabular-nums">{formatCount(pengunduhUnik)}</p>
            </div>
            <div className="bg-background p-5">
              <p className="eyebrow">Ditolak</p>
              <p className="mt-2 font-display text-3xl tabular-nums">{formatCount(ditolak)}</p>
            </div>
          </div>

          {urlSheet ? (
            <div>
              <ButtonLink
                href={urlSheet}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
              >
                Buka di Google Sheets
                <ExternalLink className="size-3.5" aria-hidden />
              </ButtonLink>
            </div>
          ) : null}
        </>
      ) : null}

      {jejak.length === 0 ? (
        aktif ? (
          <EmptyState
            title="Belum ada catatan"
            description="Catatan muncul begitu ada yang mencoba mengunduh berkas arsip."
          />
        ) : null
      ) : (
        <div className="table-scroll rounded border border-border">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="px-4 py-3 font-medium">Waktu</th>
                <th scope="col" className="px-4 py-3 font-medium">Pengguna</th>
                <th scope="col" className="px-4 py-3 font-medium">Berkas</th>
                <th scope="col" className="px-4 py-3 font-medium">Hasil</th>
              </tr>
            </thead>
            <tbody>
              {jejak.map((j, i) => (
                <tr key={`${j.waktu}-${i}`} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-subtle tabular-nums">
                    {waktuLengkap(j.waktu)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{j.email || "tanpa akun"}</span>
                    {j.peran ? <span className="text-xs text-subtle">{j.peran}</span> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block">{j.berkas || "—"}</span>
                    {j.mataKuliah ? (
                      <span className="text-xs text-subtle">{j.mataKuliah}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={NADA[j.hasil] ?? "neutral"}>
                      {LABEL_HASIL[j.hasil] ?? j.hasil}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
