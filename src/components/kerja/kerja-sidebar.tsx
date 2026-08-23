"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, Gauge, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkProject } from "@/lib/workspace-types";

const WARNA_TITIK: Record<string, string> = {
  aktif: "bg-success",
  selesai: "bg-subtle",
  arsip: "bg-subtle",
};

export function KerjaSidebar({ proyek }: { proyek: WorkProject[] }) {
  const pathname = usePathname();
  const aktif = proyek.filter((p) => p.status !== "arsip");

  return (
    <nav aria-label="Navigasi Ultraproduktif" className="flex flex-col gap-6">
      <ul className="flex flex-col gap-0.5">
        <li>
          <Link
            href="/ultraproduktif"
            className={cn(
              "flex min-h-[40px] items-center gap-2.5 rounded px-3 text-sm transition-colors duration-200",
              pathname === "/ultraproduktif" ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Gauge className="size-4 shrink-0" aria-hidden />
            Ringkasan
          </Link>
        </li>
        <li>
          <Link
            href="/ultraproduktif/jadwal"
            className={cn(
              "flex min-h-[40px] items-center gap-2.5 rounded px-3 text-sm transition-colors duration-200",
              pathname === "/ultraproduktif/jadwal" ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <CalendarClock className="size-4 shrink-0" aria-hidden />
            Jadwal
          </Link>
        </li>
      </ul>

      <div>
        <div className="flex items-center justify-between px-3">
          <p className="eyebrow">Proyek</p>
          <Link href="/ultraproduktif/proyek/baru" className="text-muted-foreground hover:text-foreground" aria-label="Proyek baru">
            <Plus className="size-4" aria-hidden />
          </Link>
        </div>
        <ul className="mt-2 flex flex-col gap-0.5">
          {aktif.length === 0 ? (
            <li className="px-3 text-xs text-subtle">Belum ada proyek.</li>
          ) : (
            aktif.map((p) => {
              const href = `/ultraproduktif/proyek/${p.id}`;
              const isAktif = pathname === href;
              return (
                <li key={p.id}>
                  <Link
                    href={href}
                    className={cn(
                      "flex min-h-[40px] items-center gap-2.5 rounded px-3 text-sm transition-colors duration-200",
                      isAktif ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", WARNA_TITIK[p.status] ?? "bg-subtle")} aria-hidden />
                    <span className="truncate">{p.judul}</span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {proyek.some((p) => p.status === "arsip") ? (
        <p className="px-3 text-xs text-subtle">
          {proyek.filter((p) => p.status === "arsip").length} proyek diarsipkan — buka dari Ringkasan.
        </p>
      ) : null}
    </nav>
  );
}
