"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Badge, Button } from "@/components/ui/primitives";
import { ProyekForm } from "@/components/kerja/proyek-form";
import { PROJECT_STATUS_LABEL, type WorkProject } from "@/lib/workspace-types";

const TONE = { aktif: "success", selesai: "neutral", arsip: "warning" } as const;

export function ProyekHeader({ proyek }: { proyek: WorkProject }) {
  const [sunting, setSunting] = useState(false);

  if (sunting) {
    return (
      <div className="flex flex-col gap-4">
        <ProyekForm proyek={proyek} />
        <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setSunting(false)}>
          Selesai menyunting
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="display-lg">{proyek.judul}</h1>
          <Badge tone={TONE[proyek.status]}>{PROJECT_STATUS_LABEL[proyek.status]}</Badge>
        </div>
        {proyek.deskripsi ? <p className="mt-2 max-w-2xl text-muted-foreground">{proyek.deskripsi}</p> : null}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => setSunting(true)}>
        <Pencil className="size-4" aria-hidden />
        Sunting
      </Button>
    </div>
  );
}
