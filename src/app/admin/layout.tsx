import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { Button, Container } from "@/components/ui/primitives";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { keluar } from "@/app/actions/auth";
import { sesiAman } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Panel Admin", template: "%s · Panel Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await sesiAman();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <Container size="wide">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <Link href="/admin" className="font-display text-lg font-semibold">
                Panel Admin
              </Link>
              <span className="hidden text-xs text-subtle sm:inline">
                {session?.user?.email}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/"
                target="_blank"
                className="inline-flex min-h-[40px] items-center gap-2 rounded px-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
              >
                Lihat situs
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
              <ThemeToggle />
              <form action={keluar}>
                <Button type="submit" variant="ghost" size="sm">
                  <LogOut className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </form>
            </div>
          </div>
        </Container>
      </header>

      <div className="flex-1">
        <Container size="wide">
          <div className="grid gap-8 py-8 lg:grid-cols-[220px_1fr] lg:gap-12">
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <AdminNav />
            </aside>
            <main id="isi" className="min-w-0">
              {children}
            </main>
          </div>
        </Container>
      </div>
    </div>
  );
}
