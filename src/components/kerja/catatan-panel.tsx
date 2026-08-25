"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Download, Eye, EyeOff, Loader2, Paperclip, Plus, Trash2 } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/ui/primitives";
import { Markdown } from "@/components/markdown";
import { buatCatatan, hapusCatatanAksi, mulaiUnggahCatatan, perbaruiCatatan } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import { formatBytes } from "@/lib/utils";
import type { WorkNote } from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : "Simpan"}
    </Button>
  );
}

/**
 * Lampiran Drive — privat & satu pengguna, jadi pratinjau & unduh langsung
 * pakai tautan resmi Drive (bukan proxy server sendiri). Lihat catatan di
 * `drive.ts`. Iframe pratinjau baru dimuat kalau tombolnya ditekan, supaya
 * membuka daftar catatan tidak otomatis memuat berat.
 */
function LampiranCatatan({ catatan }: { catatan: WorkNote }) {
  const [tampil, setTampil] = useState(false);
  if (!catatan.berkasDriveId) return null;

  const id = catatan.berkasDriveId;

  return (
    <div className="mt-4 rounded border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm font-medium">{catatan.berkasNama ?? "Berkas terlampir"}</span>
          {catatan.berkasUkuran ? (
            <span className="shrink-0 text-xs text-subtle">{formatBytes(catatan.berkasUkuran)}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setTampil((v) => !v)}>
            {tampil ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            {tampil ? "Tutup" : "Pratinjau"}
          </Button>
          <a
            href={`https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded px-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
          >
            <Download className="size-3.5" aria-hidden />
            Unduh
          </a>
        </div>
      </div>

      {tampil ? (
        <iframe
          src={`https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`}
          className="mt-3 h-[70vh] w-full rounded border border-border"
          allow="autoplay"
        />
      ) : null}
    </div>
  );
}

function CatatanItem({ catatan, proyekId }: { catatan: WorkNote; proyekId: string }) {
  const [buka, setBuka] = useState(false);
  const [sunting, setSunting] = useState(false);
  const aksi = perbaruiCatatan.bind(null, catatan.id, proyekId);
  const [state, formAction] = useActionState(aksi, FORM_STATE_AWAL);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="rounded border border-border">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-medium">{catatan.judul}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200", buka && "rotate-180")} aria-hidden />
      </button>

      {buka ? (
        <div className="border-t border-border p-4">
          {sunting ? (
            <form action={formAction} className="flex flex-col gap-3">
              <Input name="judul" defaultValue={catatan.judul} required />
              <Textarea name="isi" defaultValue={catatan.isi} rows={10} spellCheck />
              {state.message ? (
                <p className={cn("text-xs", state.ok ? "text-success" : "text-destructive")}>{state.message}</p>
              ) : null}
              <div className="flex gap-2">
                <TombolSimpan />
                <Button type="button" variant="ghost" size="sm" onClick={() => setSunting(false)}>
                  Batal
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Markdown className="text-sm">{catatan.isi}</Markdown>
              <LampiranCatatan catatan={catatan} />
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setSunting(true)}>
                  Sunting
                </Button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await hapusCatatanAksi(catatan.id, proyekId);
                      router.refresh();
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-destructive hover:bg-muted"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Hapus
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Beda dari form lain di sini (yang lewat `useActionState` + `<form action>`
 * langsung), form ini butuh dua langkah async berurutan SEBELUM
 * `buatCatatan` sungguh dipanggil: minta URL sesi unggah ke server
 * (`mulaiUnggahCatatan`), lalu PUT isi berkasnya langsung ke Drive dari
 * peramban. Karena itu dikendalikan manual lewat `useTransition`, bukan
 * `<form action>` — pola yang sama dipakai `QuickAddSheet`.
 */
function CatatanBaruForm({ proyekId, onSelesai }: { proyekId: string; onSelesai: () => void }) {
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [berkas, setBerkas] = useState<File | null>(null);
  const [tautan, setTautan] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function kirim() {
    if (!judul.trim()) {
      setPesan("Judul catatan wajib diisi.");
      return;
    }
    setPesan(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.set("judul", judul.trim());
      fd.set("isi", isi);

      if (berkas) {
        setStatus("Menyiapkan unggahan…");
        const sesi = await mulaiUnggahCatatan(berkas.name, berkas.type || "application/octet-stream");
        if (!sesi.ok) {
          setStatus(null);
          setPesan(sesi.message);
          return;
        }

        setStatus(`Mengunggah ${berkas.name}…`);
        let hasilUnggah: Response;
        try {
          hasilUnggah = await fetch(sesi.url, {
            method: "PUT",
            headers: { "Content-Type": berkas.type || "application/octet-stream" },
            body: berkas,
          });
        } catch {
          setStatus(null);
          setPesan("Gagal mengunggah berkas — periksa koneksi lalu coba lagi.");
          return;
        }
        if (!hasilUnggah.ok) {
          setStatus(null);
          setPesan("Google Drive menolak unggahan. Coba lagi.");
          return;
        }

        const meta = (await hasilUnggah.json()) as { id: string; name: string; mimeType: string; size?: string };
        fd.set("berkas_drive_id", meta.id);
        fd.set("berkas_nama", meta.name);
        fd.set("berkas_mime", meta.mimeType);
        if (meta.size) fd.set("berkas_ukuran", meta.size);
      } else if (tautan.trim()) {
        fd.set("berkas_tautan", tautan.trim());
      }

      setStatus(null);
      const hasil = await buatCatatan(proyekId, FORM_STATE_AWAL, fd);
      if (hasil.ok) {
        onSelesai();
      } else {
        setPesan(hasil.message ?? "Gagal menyimpan.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-dashed border-border-strong p-4">
      <Input value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul catatan" autoFocus />
      <Textarea value={isi} onChange={(e) => setIsi(e.target.value)} placeholder="Tulis dalam Markdown…" rows={8} spellCheck />

      <Field label="Lampiran (opsional)" htmlFor="catatan-berkas" hint="Ukuran berapa pun, langsung ke Drive dari peramban.">
        <input
          id="catatan-berkas"
          type="file"
          onChange={(e) => setBerkas(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border file:border-border-strong file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-foreground"
        />
      </Field>
      <Field
        label="Atau tempel tautan Drive"
        htmlFor="catatan-berkas-tautan"
        hint="Berkas sudah ada di Drive? Tempel link-nya di sini, tidak perlu unggah ulang."
      >
        <Input
          id="catatan-berkas-tautan"
          value={tautan}
          onChange={(e) => setTautan(e.target.value)}
          placeholder="https://drive.google.com/file/d/…"
          disabled={!!berkas}
        />
      </Field>

      {status ? <p className="text-xs text-muted-foreground">{status}</p> : null}
      {pesan ? <p className="text-xs text-destructive">{pesan}</p> : null}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={kirim} disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : "Simpan"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onSelesai}>
          Batal
        </Button>
      </div>
    </div>
  );
}

export function CatatanPanel({ proyekId, catatan }: { proyekId: string; catatan: WorkNote[] }) {
  const [tambah, setTambah] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="eyebrow">Catatan & materi</h3>
        {!tambah ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setTambah(true)}>
            <Plus className="size-4" aria-hidden />
            Catatan baru
          </Button>
        ) : null}
      </div>

      {tambah ? <CatatanBaruForm proyekId={proyekId} onSelesai={() => setTambah(false)} /> : null}

      {catatan.length === 0 && !tambah ? (
        <p className="rounded border border-dashed border-border-strong p-5 text-center text-sm text-muted-foreground">
          Belum ada catatan. Simpan referensi, tautan berkas, atau progres di sini.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {catatan.map((c) => (
            <CatatanItem key={c.id} catatan={c} proyekId={proyekId} />
          ))}
        </div>
      )}
    </div>
  );
}
