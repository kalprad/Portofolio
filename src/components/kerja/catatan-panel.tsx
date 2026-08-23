"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import { Markdown } from "@/components/markdown";
import { buatCatatan, hapusCatatanAksi, perbaruiCatatan } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
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

function CatatanBaruForm({ proyekId, onSelesai }: { proyekId: string; onSelesai: () => void }) {
  const aksi = buatCatatan.bind(null, proyekId);
  const [state, formAction] = useActionState(aksi, FORM_STATE_AWAL);

  useEffect(() => {
    if (state.ok) onSelesai();
  }, [state.ok, onSelesai]);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-dashed border-border-strong p-4">
      <Input name="judul" placeholder="Judul catatan" autoFocus required />
      <Textarea name="isi" placeholder="Tulis dalam Markdown…" rows={8} spellCheck />
      {state.message ? <p className="text-xs text-destructive">{state.message}</p> : null}
      <div className="flex gap-2">
        <TombolSimpan />
        <Button type="button" variant="ghost" size="sm" onClick={onSelesai}>
          Batal
        </Button>
      </div>
    </form>
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
