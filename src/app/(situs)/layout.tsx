import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export default function SitusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="isi" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
