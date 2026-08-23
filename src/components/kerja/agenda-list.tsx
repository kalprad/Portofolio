"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ListTodo, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/primitives";
import { hapusJadwalAksi } from "@/lib/workspace-actions";
import { formatTanggalLokal, formatWaktuLokal, tanggalKey } from "@/lib/workspace-utils";
import type { AgendaEntry } from "@/lib/workspace-types";

export function AgendaList({ entri }: { entri: AgendaEntry[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (entri.length === 0) {
    return (
      <EmptyState
        title="Belum ada agenda"
        description="Tugas bertenggat dan jadwal yang dibuat akan muncul di sini, terurut per hari."
      />
    );
  }

  const kelompok = new Map<string, AgendaEntry[]>();
  for (const e of entri) {
    const k = tanggalKey(e.waktu);
    if (!kelompok.has(k)) kelompok.set(k, []);
    kelompok.get(k)!.push(e);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...kelompok.entries()].map(([tanggal, items]) => (
        <div key={tanggal}>
          <p className="eyebrow mb-2">{formatTanggalLokal(items[0].waktu)}</p>
          <ul className="flex flex-col rounded border border-border">
            {items.map((e, i) => (
              <li
                key={`${e.kind}-${e.id}`}
                className={`flex items-center justify-between gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="flex min-w-0 items-start gap-3">
                  {e.kind === "tugas" ? (
                    <ListTodo className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                  <div className="min-w-0">
                    {e.proyekId && e.kind === "tugas" ? (
                      <Link href={`/admin/kerja/proyek/${e.proyekId}`} className="truncate text-sm font-medium hover:text-accent">
                        {e.judul}
                      </Link>
                    ) : (
                      <p className="truncate text-sm font-medium">{e.judul}</p>
                    )}
                    <p className="text-xs text-subtle">
                      {formatWaktuLokal(e.waktu)}
                      {e.proyekJudul ? ` · ${e.proyekJudul}` : ""}
                    </p>
                  </div>
                </div>

                {e.kind === "jadwal" ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await hapusJadwalAksi(e.id);
                        router.refresh();
                      })
                    }
                    className="shrink-0 rounded p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                    aria-label="Hapus jadwal"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
