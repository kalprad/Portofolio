"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { hapusEntitas } from "@/app/admin/actions";

function TombolKonfirmasi() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Menghapus…
        </>
      ) : (
        "Ya, hapus permanen"
      )}
    </Button>
  );
}

/**
 * Hapus dengan konfirmasi dua langkah.
 *
 * Sengaja tidak memakai `window.confirm`: dialog bawaan peramban mudah
 * diklik refleks. Menaruh konfirmasinya di tempat yang sama, dengan kata
 * "permanen" terbaca, membuat jeda yang diperlukan.
 */
export function DeleteButton({
  resourceKey,
  id,
  label = "Hapus",
}: {
  resourceKey: string;
  id: string;
  label?: string;
}) {
  const [minta, setMinta] = useState(false);
  const aksi = hapusEntitas.bind(null, resourceKey, id);

  if (!minta) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setMinta(true)}>
        <Trash2 className="size-4" aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <form action={aksi}>
        <TombolKonfirmasi />
      </form>
      <Button variant="ghost" size="sm" onClick={() => setMinta(false)}>
        Batal
      </Button>
    </span>
  );
}
