import Link from "next/link";
import { sesiAman } from "@/lib/auth";
import { getProfile } from "@/lib/queries";
import { HeaderNav } from "@/components/header-nav";
import { Container } from "@/components/ui/primitives";
import type { SocialLink } from "@/lib/types";

export async function SiteHeader() {
  const [session, profile] = await Promise.all([sesiAman(), getProfile()]);

  return (
    <HeaderNav
      nama={profile?.full_name ?? "Rizki Haikal"}
      isAdmin={Boolean(session?.user?.isAdmin)}
      sudahMasuk={Boolean(session?.user)}
    />
  );
}

const TAUTAN_KAKI = [
  { href: "/tentang", label: "Tentang" },
  { href: "/portofolio", label: "Portofolio" },
  { href: "/tulisan", label: "Tulisan" },
  { href: "/arsip", label: "Arsip Kuliah" },
  { href: "/cv", label: "CV" },
];

export async function SiteFooter() {
  const profile = await getProfile();
  const tahun = new Date().getFullYear();
  const sosial = (profile?.social_links ?? []) as SocialLink[];

  return (
    <footer className="mt-24 border-t border-border">
      <Container size="wide">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-xl font-semibold">
              {profile?.full_name ?? "Rizki Haikal"}
            </p>
            {profile?.headline_id ? (
              <p className="mt-1.5 text-sm text-muted-foreground">{profile.headline_id}</p>
            ) : null}
            {profile?.email ? (
              <a
                href={`mailto:${profile.email}`}
                className="link-underline mt-4 inline-block text-sm"
              >
                {profile.email}
              </a>
            ) : null}
          </div>

          <div>
            <p className="eyebrow">Jelajahi</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {TAUTAN_KAKI.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Tautan</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {sosial.length > 0 ? (
                sosial.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      {s.label}
                    </a>
                  </li>
                ))
              ) : (
                <li className="text-sm text-subtle">Belum ada tautan.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {tahun} {profile?.full_name ?? "Rizki Haikal"}
          </p>
          <p>Dibangun dengan Next.js, di-deploy di Vercel.</p>
        </div>
      </Container>
    </footer>
  );
}
