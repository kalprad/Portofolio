"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, RotateCcw, X } from "lucide-react";
import { unggahGambar } from "@/app/admin/upload-actions";
import { cn } from "@/lib/utils";

/**
 * Kolom unggah foto: pengguna pilih berkas dari perangkatnya, gambar langsung
 * dikompres dan tersimpan di server, dan path hasilnya diisikan ke input
 * tersembunyi bernama `name` — persis seperti kolom teks biasa, sehingga sisa
 * alur formulir (validasi, penyimpanan ke entitas) tidak perlu berubah.
 *
 * Berkas gambarnya sendiri sudah tersimpan begitu unggahan selesai (satu
 * commit tersendiri). Menekan Simpan di formulir utama yang menautkan path
 * itu ke entitasnya (profil/proyek/tulisan).
 */
export function ImageUploadField({
  name,
  awal,
  prefix,
}: {
  name: string;
  awal: string;
  prefix: string;
}) {
  const [url, setUrl] = useState(awal);
  // Pratinjau dipisah dari `url`: path hasil unggahan baru berguna di produksi
  // setelah Vercel selesai deploy ulang (~1 menit), jadi menampilkannya
  // langsung akan sempat terlihat rusak. Pratinjau dari berkas lokal muncul
  // seketika tanpa menunggu itu.
  const [pratinjau, setPratinjau] = useState<string | null>(null);
  const [status, setStatus] = useState<"diam" | "mengunggah" | "gagal">("diam");
  const [pesanGagal, setPesanGagal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pratinjau) URL.revokeObjectURL(pratinjau);
    };
  }, [pratinjau]);

  async function tanganiFile(file: File | undefined) {
    if (!file) return;

    if (pratinjau) URL.revokeObjectURL(pratinjau);
    setPratinjau(URL.createObjectURL(file));
    setStatus("mengunggah");
    setPesanGagal(null);

    const fd = new FormData();
    fd.set("file", file);
    fd.set("prefix", prefix);

    const hasil = await unggahGambar(fd);

    if (hasil.ok && hasil.url) {
      setUrl(hasil.url);
      setStatus("diam");
    } else {
      setStatus("gagal");
      setPesanGagal(hasil.message ?? "Gagal mengunggah gambar.");
    }
  }

  const tampilkan = pratinjau ?? url;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name={name} value={url} />

      <div
        className={cn(
          "relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-border-strong bg-muted",
          status === "mengunggah" && "opacity-60",
        )}
      >
        {tampilkan ? (
          // eslint-disable-next-line @next/next/no-img-element -- pratinjau bisa berupa blob: URL lokal, tidak lewat next/image
          <img src={tampilkan} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-6 text-subtle" aria-hidden />
        )}
        {status === "mengunggah" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={status === "mengunggah"}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border-strong px-3 py-1.5 text-sm font-medium transition-colors duration-200 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ImagePlus className="size-3.5" aria-hidden />
            {tampilkan ? "Ganti foto" : "Pilih foto"}
          </button>
          {tampilkan ? (
            <button
              type="button"
              onClick={() => {
                if (pratinjau) URL.revokeObjectURL(pratinjau);
                setPratinjau(null);
                setUrl("");
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border-strong px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted"
            >
              <X className="size-3.5" aria-hidden />
              Hapus
            </button>
          ) : null}
          {status === "gagal" ? (
            <button
              type="button"
              onClick={() => setStatus("diam")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border-strong px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Coba lagi
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => tanganiFile(e.target.files?.[0])}
        />

        <p className="text-xs text-muted-foreground">
          {status === "mengunggah"
            ? "Mengunggah dan mengompres…"
            : status === "gagal"
              ? pesanGagal
              : "JPG/PNG/WebP, otomatis dikecilkan dan dikompres. Tetap perlu menekan Simpan di bawah setelah memilih foto."}
        </p>
      </div>
    </div>
  );
}
