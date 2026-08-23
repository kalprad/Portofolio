"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/primitives";
import type { SocialLink } from "@/lib/types";

/**
 * Daftar tautan sosial yang bisa ditambah/dihapus bebas, bukan kolom tetap.
 *
 * Nilainya disimpan sebagai satu JSON di dalam input tersembunyi bernama
 * `name`, supaya tetap ikut terkirim lewat formulir biasa tanpa perlu
 * penanganan khusus di sisi server selain menguraikannya kembali.
 */
export function SocialLinksField({ name, awal }: { name: string; awal: string }) {
  const [items, setItems] = useState<SocialLink[]>(() => {
    try {
      const parsed = JSON.parse(awal || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  function perbarui(i: number, kunci: "label" | "url", nilai: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [kunci]: nilai } : it)));
  }

  function tambah() {
    setItems((prev) => [...prev, { label: "", url: "" }]);
  }

  function hapus(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada tautan. Tambahkan di bawah.</p>
      ) : null}

      {items.map((it, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={it.label}
            onChange={(e) => perbarui(i, "label", e.target.value)}
            placeholder="Label, misalnya LinkedIn"
            className="sm:w-44"
          />
          <Input
            value={it.url}
            onChange={(e) => perbarui(i, "url", e.target.value)}
            placeholder="https://..."
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => hapus(i)}
            aria-label={`Hapus tautan ${it.label || `ke-${i + 1}`}`}
            className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center self-end rounded text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-destructive sm:self-auto"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={tambah}
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded border border-dashed border-border-strong px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-3.5" aria-hidden />
        Tambah tautan
      </button>
    </div>
  );
}
