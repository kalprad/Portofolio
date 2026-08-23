import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { Container, ButtonLink, Badge } from "@/components/ui/primitives";
import { Markdown } from "@/components/markdown";
import { getProfile, getCvEntries } from "@/lib/queries";
import { CV_SECTION_LABEL } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tentang",
  description: "Latar belakang, fokus riset, dan cara menghubungi saya.",
};

export default async function Tentang() {
  const [profile, cv] = await Promise.all([getProfile(), getCvEntries()]);

  const keahlian = cv.filter((e) => e.section === "keahlian");
  const pendidikan = cv.filter((e) => e.section === "pendidikan");

  return (
    <Container size="default">
      <div className="py-16 sm:py-24">
        <p className="eyebrow">Tentang</p>
        <h1 className="display-lg mt-4">{profile?.full_name ?? "Rizki Haikal"}</h1>
        {profile?.headline_id ? (
          <p className="mt-4 text-xl text-muted-foreground">{profile.headline_id}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {profile?.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden />
              {profile.location}
            </span>
          ) : null}
          {profile?.email ? (
            <a
              href={`mailto:${profile.email}`}
              className="link-underline inline-flex items-center gap-1.5"
            >
              <Mail className="size-4" aria-hidden />
              {profile.email}
            </a>
          ) : null}
        </div>

        <div className="mt-14 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <Markdown>{profile?.bio_id}</Markdown>
            {!profile?.bio_id ? (
              <p className="text-muted-foreground">
                Deskripsi diri belum diisi. Tambahkan lewat panel admin di{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/admin/profil</code>.
              </p>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/cv">
                Lihat CV lengkap
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/portofolio" variant="outline">
                Portofolio
              </ButtonLink>
            </div>
          </div>

          <aside className="flex flex-col gap-10">
            {profile?.avatar_url ? (
              <div className="overflow-hidden rounded border border-border">
                {/* Bingkai potret: rasio dikunci supaya tidak ada pergeseran
                    tata letak saat gambar dimuat, dan foto tegak tidak
                    terpotong seperti kalau dipaksa ke bingkai lanskap. */}
                <Image
                  src={profile.avatar_url}
                  alt={`Foto ${profile.full_name}`}
                  width={900}
                  height={1200}
                  className="aspect-[3/4] w-full object-cover"
                  priority
                />
              </div>
            ) : null}

            {pendidikan.length > 0 ? (
              <section>
                <h2 className="eyebrow">{CV_SECTION_LABEL.pendidikan}</h2>
                <ul className="mt-4 flex flex-col gap-5">
                  {pendidikan.map((e) => (
                    <li key={e.id} className="border-t border-border pt-4">
                      <p className="font-medium leading-snug">{e.title_id}</p>
                      {e.organization ? (
                        <p className="mt-1 text-sm text-muted-foreground">{e.organization}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-subtle tabular-nums">
                        {formatDateRange(e.start_date, e.end_date, e.is_current)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {keahlian.length > 0 ? (
              <section>
                <h2 className="eyebrow">{CV_SECTION_LABEL.keahlian}</h2>
                <ul className="mt-4 flex flex-col gap-4">
                  {keahlian.map((e) => (
                    <li key={e.id} className="border-t border-border pt-4">
                      <p className="text-sm font-medium">{e.title_id}</p>
                      {e.description_id ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {e.description_id.split(",").map((k) => (
                            <Badge key={k.trim()}>{k.trim()}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </Container>
  );
}
