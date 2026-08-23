"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Mail, Loader2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui/primitives";
import { kirimRingkasanProyek } from "@/lib/workspace-actions";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import { cn } from "@/lib/utils";

function TombolKirim() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Mail className="size-3.5" aria-hidden />}
      Kirim
    </Button>
  );
}

export function KirimRingkasanForm({ proyekId }: { proyekId: string }) {
  const aksi = kirimRingkasanProyek.bind(null, proyekId);
  const [state, formAction] = useActionState(aksi, FORM_STATE_AWAL);
  const [terbuka, setTerbuka] = useState(false);

  if (!terbuka) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setTerbuka(true)}>
        <Mail className="size-4" aria-hidden />
        Kirim ringkasan
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border border-border bg-surface p-4 sm:flex-row sm:items-end">
      <Field label="Kirim ringkasan ke" htmlFor="ke-ringkasan" hint="Kosongkan untuk kirim ke email akun lo sendiri." className="flex-1">
        <Input id="ke-ringkasan" name="ke" type="email" placeholder="nama@email.com" />
      </Field>
      <div className="flex shrink-0 gap-2">
        <TombolKirim />
        <Button type="button" variant="ghost" size="sm" onClick={() => setTerbuka(false)}>
          Batal
        </Button>
      </div>
      {state.message ? (
        <p className={cn("basis-full text-xs", state.ok ? "text-success" : "text-destructive")}>{state.message}</p>
      ) : null}
    </form>
  );
}
