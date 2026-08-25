"use client";

import { useEffect, useState, useTransition } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Plus, Trash2, X } from "lucide-react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { hapusTugasAksi, perbaruiTugas, pindahkanTugas, tambahTugasCepat } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import { formatWaktuLokal, sudahLewat } from "@/lib/workspace-utils";
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
  type TaskPriority,
  type TaskStatus,
  type WorkTask,
} from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

const PRIORITAS_WARNA: Record<TaskPriority, string> = {
  tinggi: "bg-destructive",
  sedang: "bg-warning",
  rendah: "bg-subtle",
};

function TombolSimpanKecil() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : "Simpan"}
    </Button>
  );
}

function FormEditTugas({
  tugas,
  proyekId,
  onTutup,
}: {
  tugas: WorkTask;
  proyekId: string;
  onTutup: () => void;
}) {
  const aksi = perbaruiTugas.bind(null, tugas.id, proyekId);
  const [state, formAction] = useActionState(aksi, FORM_STATE_AWAL);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-border-strong bg-surface p-3">
      <Field label="Judul" htmlFor={`judul-${tugas.id}`}>
        <Input id={`judul-${tugas.id}`} name="judul" defaultValue={tugas.judul} required />
      </Field>
      <Field label="Keterangan" htmlFor={`ket-${tugas.id}`}>
        <Textarea id={`ket-${tugas.id}`} name="deskripsi" defaultValue={tugas.deskripsi ?? ""} rows={2} className="font-sans" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prioritas" htmlFor={`prio-${tugas.id}`}>
          <Select id={`prio-${tugas.id}`} name="prioritas" defaultValue={tugas.prioritas}>
            {Object.entries(TASK_PRIORITY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tenggat" htmlFor={`tenggat-${tugas.id}`} hint="Otomatis muncul di Google Calendar.">
          <Input id={`tenggat-${tugas.id}`} name="tenggat" type="datetime-local" defaultValue={tugas.tenggat ?? ""} />
        </Field>
      </div>

      {state.message ? (
        <p className={cn("text-xs", state.ok ? "text-success" : "text-destructive")}>{state.message}</p>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <TombolSimpanKecil />
          <Button type="button" variant="ghost" size="sm" onClick={onTutup}>
            Tutup
          </Button>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await hapusTugasAksi(tugas.id, proyekId);
              router.refresh();
            })
          }
          className="inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-destructive hover:bg-muted"
        >
          <Trash2 className="size-3.5" aria-hidden />
          Hapus
        </button>
      </div>
    </form>
  );
}

function KartuTugas({
  tugas,
  proyekId,
  terbuka,
  onKlik,
  onDragStart,
  onGeser,
  bisaMundur,
  bisaMaju,
}: {
  tugas: WorkTask;
  proyekId: string;
  terbuka: boolean;
  onKlik: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onGeser: (arah: -1 | 1) => void;
  bisaMundur: boolean;
  bisaMaju: boolean;
}) {
  const lewat = sudahLewat(tugas.tenggat);

  if (terbuka) {
    return <FormEditTugas tugas={tugas} proyekId={proyekId} onTutup={onKlik} />;
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex cursor-grab flex-col gap-2 rounded border border-border bg-surface p-3 transition-colors duration-200 hover:border-border-strong active:cursor-grabbing"
    >
      <button type="button" onClick={onKlik} className="flex w-full flex-col gap-2 text-left">
        <div className="flex items-start gap-2">
          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", PRIORITAS_WARNA[tugas.prioritas])} aria-hidden />
          <p className="text-sm font-medium">{tugas.judul}</p>
        </div>
        {tugas.tenggat ? (
          <p className={cn("flex items-center gap-1 pl-3.5 text-xs", lewat ? "font-medium text-destructive" : "text-muted-foreground")}>
            {lewat ? <AlertTriangle className="size-3" aria-hidden /> : null}
            {formatWaktuLokal(tugas.tenggat)}
          </p>
        ) : null}
      </button>

      {/* Alternatif drag buat sentuhan — HTML5 drag-and-drop tidak punya event
          sentuh sama sekali, jadi tanpa ini tugas tidak bisa dipindah status di HP. */}
      <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
        <button
          type="button"
          disabled={!bisaMundur}
          onClick={() => onGeser(-1)}
          aria-label="Pindah ke status sebelumnya"
          className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          disabled={!bisaMaju}
          onClick={() => onGeser(1)}
          aria-label="Pindah ke status berikutnya"
          className="flex size-8 items-center justify-center rounded text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function TambahTugasCepat({ proyekId, status }: { proyekId: string; status: TaskStatus }) {
  const [terbuka, setTerbuka] = useState(false);
  const aksi = tambahTugasCepat.bind(null, proyekId, status);

  if (!terbuka) {
    return (
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        className="flex min-h-[38px] w-full items-center gap-1.5 rounded px-2 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden />
        Tambah tugas
      </button>
    );
  }

  return (
    <form
      action={(fd) => {
        aksi(fd);
        setTerbuka(false);
      }}
      className="flex flex-col gap-2"
    >
      <Input name="judul" placeholder="Judul tugas" autoFocus required />
      <div className="flex gap-2">
        <Button type="submit" size="sm">Tambah</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setTerbuka(false)}>
          <X className="size-3.5" aria-hidden />
        </Button>
      </div>
    </form>
  );
}

export function PapanTugas({ proyekId, tugasAwal }: { proyekId: string; tugasAwal: WorkTask[] }) {
  const [tugas, setTugas] = useState(tugasAwal);
  const [terbukaId, setTerbukaId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => setTugas(tugasAwal), [tugasAwal]);

  function pindah(id: string, status: TaskStatus) {
    // Hitung nilai barunya dari state SEKARANG, di luar updater — updater
    // `setTugas` harus murni (tidak boleh punya efek samping seperti
    // memanggil startTransition di dalamnya). React boleh memanggil updater
    // lebih dari sekali; kalau startTransition ikut di dalam, transisinya
    // bisa nyangkut dan interaksi berikutnya di papan jadi tidak merespons
    // sama sekali sampai halaman dimuat ulang — itu bug yang barusan kejadian.
    const kolom = tugas.filter((t) => t.status === status && t.id !== id);
    const urutan = kolom.length ? Math.max(...kolom.map((t) => t.urutan)) + 1 : 1;

    setTugas((prev) => prev.map((t) => (t.id === id ? { ...t, status, urutan } : t)));

    startTransition(async () => {
      await pindahkanTugas(id, proyekId, status, urutan);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TASK_STATUS_ORDER.map((status, indeksStatus) => {
        const kolom = tugas.filter((t) => t.status === status).sort((a, b) => a.urutan - b.urutan);
        return (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) pindah(id, status);
            }}
            className="flex flex-col gap-3 rounded border border-border bg-muted/40 p-3"
          >
            <div className="flex items-baseline justify-between px-1">
              <h3 className="text-sm font-semibold">{TASK_STATUS_LABEL[status]}</h3>
              <span className="text-xs text-subtle">{kolom.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {kolom.map((t) => (
                <KartuTugas
                  key={t.id}
                  tugas={t}
                  proyekId={proyekId}
                  terbuka={terbukaId === t.id}
                  onKlik={() => setTerbukaId((cur) => (cur === t.id ? null : t.id))}
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                  onGeser={(arah) => {
                    const tujuan = TASK_STATUS_ORDER[indeksStatus + arah];
                    if (tujuan) pindah(t.id, tujuan);
                  }}
                  bisaMundur={indeksStatus > 0}
                  bisaMaju={indeksStatus < TASK_STATUS_ORDER.length - 1}
                />
              ))}
            </div>

            <TambahTugasCepat proyekId={proyekId} status={status} />
          </div>
        );
      })}
    </div>
  );
}
