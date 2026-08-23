"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { buatProyek, perbaruiProyek } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import { PROJECT_STATUS_LABEL, type WorkProject } from "@/lib/workspace-types";
import { cn } from "@/lib/utils";

const WARNA_PILIHAN = [
  { value: "", label: "Netral" },
  { value: "biru", label: "Biru" },
  { value: "hijau", label: "Hijau" },
  { value: "kuning", label: "Kuning" },
  { value: "merah", label: "Merah" },
  { value: "ungu", label: "Ungu" },
];

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Menyimpan…" : "Simpan"}
    </Button>
  );
}

export function ProyekForm({ proyek }: { proyek?: WorkProject }) {
  const aksi = proyek ? perbaruiProyek.bind(null, proyek.id) : buatProyek;
  const [state, formAction] = useActionState(aksi, FORM_STATE_AWAL);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {state.message ? (
        <p className={cn("rounded border px-4 py-3 text-sm", state.ok ? "border-success/40 bg-muted text-success" : "border-destructive/40 bg-muted text-destructive")}>
          {state.message}
        </p>
      ) : null}

      <Field label="Nama proyek" htmlFor="judul" required>
        <Input id="judul" name="judul" defaultValue={proyek?.judul} required autoFocus={!proyek} />
      </Field>

      <Field label="Deskripsi" htmlFor="deskripsi" hint="Opsional — konteks singkat proyeknya apa.">
        <Textarea id="deskripsi" name="deskripsi" defaultValue={proyek?.deskripsi ?? ""} rows={4} className="font-sans" />
      </Field>

      <div className="grid grid-cols-2 gap-5">
        {proyek ? (
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={proyek.status}>
              {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field label="Warna label" htmlFor="warna">
          <Select id="warna" name="warna" defaultValue={proyek?.warna ?? ""}>
            {WARNA_PILIHAN.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <TombolSimpan />
      </div>
    </form>
  );
}
