"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function SinkronButton() {
  const [pending, startTransition] = useTransition();
  const [pesan, setPesan] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              const res = await fetch("/api/cron/sinkron-kalender");
              const data = (await res.json()) as {
                ok: boolean;
                message?: string;
                diproses?: number;
                dibuat?: number;
                diperbarui?: number;
              };
              setPesan(
                data.message ??
                  `Selesai — ${data.diproses ?? 0} acara diperiksa, ${data.dibuat ?? 0} baru, ${data.diperbarui ?? 0} diperbarui.`,
              );
              router.refresh();
            } catch {
              setPesan("Gagal menghubungi server sinkron.");
            }
          })
        }
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RefreshCw className="size-3.5" aria-hidden />}
        Sinkron Calendar sekarang
      </Button>
      {pesan ? <p className="text-xs text-muted-foreground">{pesan}</p> : null}
    </div>
  );
}
