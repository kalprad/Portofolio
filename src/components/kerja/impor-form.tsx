"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Field, Textarea } from "@/components/ui/primitives";
import { imporBrief } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import { cn } from "@/lib/utils";

function Tombol() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Mengimpor…" : "Impor ke Sheets"}
    </Button>
  );
}

export function ImporForm() {
  const [state, formAction] = useActionState(imporBrief, FORM_STATE_AWAL);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      {state.message ? (
        <p className={cn("rounded border px-4 py-3 text-sm", state.ok ? "border-success/40 bg-muted text-success" : "border-destructive/40 bg-muted text-destructive")}>
          {state.message}
        </p>
      ) : null}
      <Field label="JSON brief" htmlFor="json" required hint="Tempel isi berkas brief-import.json. Aman diulang: proyek dan tugas yang sudah ada dilewati.">
        <Textarea id="json" name="json" rows={14} required className="font-mono text-xs" spellCheck={false} />
      </Field>
      <div>
        <Tombol />
      </div>
    </form>
  );
}
