"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { buatJadwal } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import type { WorkProject } from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan…" : "Tambah jadwal"}
    </Button>
  );
}

export function JadwalForm({ proyek }: { proyek: WorkProject[] }) {
  const [state, formAction] = useActionState(buatJadwal, FORM_STATE_AWAL);
  const formRef = useRef<HTMLFormElement>(null);
  const [terbuka, setTerbuka] = useState(false);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setTerbuka(false);
    }
  }, [state.ok]);

  if (!terbuka) {
    return (
      <Button type="button" onClick={() => setTerbuka(true)}>
        Jadwal baru
      </Button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4 rounded border border-border bg-surface p-5">
      {state.message ? (
        <p className={cn("text-sm", state.ok ? "text-success" : "text-destructive")}>{state.message}</p>
      ) : null}

      <Field label="Judul" htmlFor="j-judul" required>
        <Input id="j-judul" name="judul" required autoFocus />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai" htmlFor="j-mulai" required>
          <Input id="j-mulai" name="mulai" type="datetime-local" required />
        </Field>
        <Field label="Selesai" htmlFor="j-selesai" hint="Kosongkan untuk otomatis 1 jam.">
          <Input id="j-selesai" name="selesai" type="datetime-local" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Proyek terkait" htmlFor="j-proyek" hint="Opsional.">
          <Select id="j-proyek" name="proyek_id" defaultValue="">
            <option value="">— tidak terikat proyek —</option>
            {proyek.map((p) => (
              <option key={p.id} value={p.id}>{p.judul}</option>
            ))}
          </Select>
        </Field>
        <Field label="Lokasi" htmlFor="j-lokasi" hint="Opsional.">
          <Input id="j-lokasi" name="lokasi" />
        </Field>
      </div>

      <Field label="Keterangan" htmlFor="j-deskripsi" hint="Opsional.">
        <Textarea id="j-deskripsi" name="deskripsi" rows={3} className="font-sans" />
      </Field>

      <div className="flex gap-2">
        <TombolSimpan />
        <Button type="button" variant="ghost" onClick={() => setTerbuka(false)}>
          Batal
        </Button>
      </div>
    </form>
  );
}
