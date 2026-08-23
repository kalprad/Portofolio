"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  FolderArchive,
  Gauge,
  ScrollText,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU = [
  { href: "/admin", label: "Ringkasan", icon: Gauge, exact: true },
  { href: "/admin/profil", label: "Profil & CV diri", icon: User },
  { href: "/admin/cv", label: "Entri CV", icon: ScrollText },
  { href: "/admin/portofolio", label: "Portofolio", icon: BookOpen },
  { href: "/admin/tulisan", label: "Tulisan", icon: FileText },
  { href: "/admin/arsip", label: "Arsip kuliah", icon: FolderArchive },
  { href: "/admin/log", label: "Jejak akses", icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigasi panel admin">
      {/* Di layar kecil menu menggulir mendatar di dalam wadahnya sendiri —
          halaman tidak pernah ikut melebar. */}
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {MENU.map((m) => {
          const aktif = m.exact ? pathname === m.href : pathname.startsWith(m.href);
          const Icon = m.icon;

          return (
            <li key={m.href} className="shrink-0 lg:shrink">
              <Link
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-[44px] w-full items-center gap-2.5 whitespace-nowrap rounded px-3 text-sm transition-colors duration-200",
                  aktif
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {m.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
