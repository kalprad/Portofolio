"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ListTodo, Loader2, NotebookPen, Plus, X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { buatCatatan, buatJadwal, tambahTugasCepat } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import type { WorkProject } from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

type Tab = "tugas" | "catatan" | "jadwal";

const TAB_LABEL: Record<Tab, string> = { tugas: "Tugas", catatan: "Catatan", jadwal: "Jadwal" };
const TAB_ICON: Record<Tab, typeof ListTodo> = { tugas: ListTodo, catatan: NotebookPen, jadwal: CalendarClock };

/**
 * Tombol mengambang + bottom sheet — pintu masuk cepat buat catat tugas,
 * catatan, atau jadwal dari halaman mana pun di Ultraproduktif tanpa harus
 * pindah ke halaman proyek dulu. Murni memanggil ulang server action yang
 * sudah ada (`tambahTugasCepat`/`buatCatatan`/`buatJadwal`).
 */
export function QuickAddSheet({ proyek }: { proyek: WorkProject[] }) {
  const proyekAktif = proyek.filter((p) => p.status === "aktif");
  const [terbuka, setTerbuka] = useState(false);
  const [tab, setTab] = useState<Tab>(proyekAktif.length > 0 ? "tugas" : "jadwal");
  const [proyekId, setProyekId] = useState(proyekAktif[0]?.id ?? "");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [mulai, setMulai] = useState("");
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (!terbuka) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTerbuka(false);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [terbuka]);

  const butuhProyek = tab === "tugas" || tab === "catatan";

  function kirim() {
    if (!judul.trim()) {
      setPesan({ ok: false, teks: "Judul wajib diisi." });
      return;
    }
    if (butuhProyek && !proyekId) {
      setPesan({ ok: false, teks: "Pilih proyek dulu." });
      return;
    }
    if (tab === "jadwal" && !mulai) {
      setPesan({ ok: false, teks: "Isi waktu mulai." });
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.set("judul", judul.trim());

      if (tab === "tugas") {
        await tambahTugasCepat(proyekId, "backlog", fd);
        setPesan({ ok: true, teks: "Tugas ditambahkan." });
      } else if (tab === "catatan") {
        fd.set("isi", isi);
        const hasil = await buatCatatan(proyekId, FORM_STATE_AWAL, fd);
        setPesan({ ok: hasil.ok, teks: hasil.ok ? "Catatan tersimpan." : (hasil.message ?? "Gagal menyimpan.") });
      } else {
        fd.set("mulai", mulai);
        if (proyekId) fd.set("proyek_id", proyekId);
        const hasil = await buatJadwal(FORM_STATE_AWAL, fd);
        setPesan({ ok: hasil.ok, teks: hasil.ok ? "Jadwal tersimpan." : (hasil.message ?? "Gagal menyimpan.") });
      }

      setJudul("");
      setIsi("");
      setMulai("");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        aria-label="Tambah cepat"
        className="fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 lg:bottom-6"
      >
        <Plus className="size-6" aria-hidden />
      </button>

      {terbuka ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            aria-label="Tutup"
            onClick={() => setTerbuka(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[1px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tambah cepat"
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-lg"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" aria-hidden />

            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold">Tambah cepat</h2>
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                aria-label="Tutup"
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 flex gap-1 rounded-full border border-border bg-muted/60 p-1">
              {(Object.keys(TAB_LABEL) as Tab[]).map((t) => {
                const Icon = TAB_ICON[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      setPesan(null);
                    }}
                    className={cn(
                      "flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full text-sm transition-colors duration-200",
                      tab === t ? "bg-foreground font-medium text-background" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {TAB_LABEL[t]}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-col gap-4">
              {butuhProyek ? (
                proyekAktif.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada proyek aktif. Buat satu proyek dulu dari halaman Ringkasan.
                  </p>
                ) : (
                  <Field label="Proyek" htmlFor="qa-proyek" required>
                    <Select id="qa-proyek" value={proyekId} onChange={(e) => setProyekId(e.target.value)}>
                      {proyekAktif.map((p) => (
                        <option key={p.id} value={p.id}>{p.judul}</option>
                      ))}
                    </Select>
                  </Field>
                )
              ) : (
                <Field label="Proyek terkait" htmlFor="qa-proyek-jadwal" hint="Opsional.">
                  <Select id="qa-proyek-jadwal" value={proyekId} onChange={(e) => setProyekId(e.target.value)}>
                    <option value="">— tidak terikat proyek —</option>
                    {proyekAktif.map((p) => (
                      <option key={p.id} value={p.id}>{p.judul}</option>
                    ))}
                  </Select>
                </Field>
              )}

              <Field label="Judul" htmlFor="qa-judul" required>
                <Input
                  id="qa-judul"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  autoFocus
                  placeholder={tab === "tugas" ? "Judul tugas" : tab === "catatan" ? "Judul catatan" : "Nama acara"}
                />
              </Field>

              {tab === "catatan" ? (
                <Field label="Isi" htmlFor="qa-isi" hint="Opsional, Markdown.">
                  <Textarea id="qa-isi" value={isi} onChange={(e) => setIsi(e.target.value)} rows={5} spellCheck />
                </Field>
              ) : null}

              {tab === "jadwal" ? (
                <Field label="Mulai" htmlFor="qa-mulai" required>
                  <Input
                    id="qa-mulai"
                    type="datetime-local"
                    value={mulai}
                    onChange={(e) => setMulai(e.target.value)}
                  />
                </Field>
              ) : null}

              {pesan ? (
                <p className={cn("text-sm", pesan.ok ? "text-success" : "text-destructive")}>{pesan.teks}</p>
              ) : null}

              <Button type="button" onClick={kirim} disabled={pending} className="mt-1">
                {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : `Tambah ${TAB_LABEL[tab].toLowerCase()}`}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
