"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, FolderKanban, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkProject } from "@/lib/workspace-types";

/**
 * Nav bawah khusus mobile (`lg:hidden`) — pengganti sidebar supaya navigasi
 * antar Ringkasan/Jadwal/Proyek terjangkau jempol tanpa scroll ke atas.
 */
export function KerjaBottomNav({ proyek }: { proyek: WorkProject[] }) {
  const pathname = usePathname();

  const proyekAktifId = pathname.match(/^\/ultraproduktif\/proyek\/([^/]+)$/)?.[1];
  const proyekAktif = proyekAktifId ? proyek.find((p) => p.id === proyekAktifId) : undefined;

  const tabs = [
    { href: "/ultraproduktif", label: "Ringkasan", icon: Gauge, aktif: pathname === "/ultraproduktif" },
    { href: "/ultraproduktif/jadwal", label: "Jadwal", icon: CalendarClock, aktif: pathname === "/ultraproduktif/jadwal" },
    {
      href: proyekAktif ? `/ultraproduktif/proyek/${proyekAktif.id}` : "/ultraproduktif",
      label: proyekAktif ? proyekAktif.judul : "Proyek",
      icon: FolderKanban,
      aktif: pathname.startsWith("/ultraproduktif/proyek/"),
    },
  ];

  return (
    <nav
      aria-label="Navigasi Ultraproduktif (mobile)"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <ul className="flex items-stretch">
        {tabs.map((t) => (
          <li key={t.label} className="flex-1">
            <Link
              href={t.href}
              aria-current={t.aktif ? "page" : undefined}
              className={cn(
                "flex min-h-[60px] flex-col items-center justify-center gap-1 px-2 text-center text-[11px] transition-colors duration-200",
                t.aktif ? "font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <t.icon className="size-5" aria-hidden />
              <span className="max-w-full truncate">{t.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
