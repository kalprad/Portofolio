"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { pindahkanTugas } from "@/lib/workspace-actions";

/** Satu ketukan untuk menandai tugas selesai — tanpa membuka papan. */
export function TombolSelesai({ id, proyekId, urutan }: { id: string; proyekId: string; urutan: number }) {
  const [pending, mulai] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Tandai selesai"
      title="Tandai selesai"
      onClick={() =>
        mulai(async () => {
          await pindahkanTugas(id, proyekId, "done", urutan);
          router.refresh();
        })
      }
      className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-border-strong text-transparent transition-colors duration-200 hover:border-success hover:text-success disabled:opacity-40"
    >
      <Check className="size-5" aria-hidden />
    </button>
  );
}
