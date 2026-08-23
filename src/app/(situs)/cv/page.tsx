import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { Container, ButtonLink, EmptyState } from "@/components/ui/primitives";
import { PrintButton } from "@/components/print-button";
import { getProfile, getCvEntries } from "@/lib/queries";
import { CV_SECTION_LABEL, CV_SECTION_ORDER, type CvEntry } from "@/lib/types";
import { formatDateRange } from "@/lib/utils";

export const metadata: Metadata = {
  title: "CV",
  description: "Riwayat pendidikan, pengalaman, publikasi, dan keahlian.",
};

export default async function HalamanCv() {
  const [profile, entri] = await Promise.all([getProfile(), getCvEntries()]);

  const perSeksi = new Map<string, CvEntry[]>();
  for (const e of entri) {
    const list = perSeksi.get(e.section) ?? [];
    list.push(e);
    perSeksi.set(e.section, list);
  }

  return (
    <Container size="default">
      <div className="py-16 sm:py-20">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Curriculum Vitae</p>
            <h1 className="display-lg mt-3">{profile?.full_name ?? "Rizki Haikal"}</h1>
            {profile?.headline_id ? (
              <p className="mt-3 text-lg text-muted-foreground">{profile.headline_id}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {profile?.location ? <span>{profile.location}</span> : null}
              {profile?.email ? <span>{profile.email}</span> : null}
              {profile?.phone ? <span>{profile.phone}</span> : null}
            </div>
          </div>

          <div className="no-print flex flex-wrap gap-3">
            <PrintButton />
            {profile?.cv_file_url ? (
              <ButtonLink href={profile.cv_file_url} target="_blank" rel="noopener noreferrer">
                <Download className="size-4" aria-hidden />
                Unduh PDF
              </ButtonLink>
            ) : null}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-14 print-compact">
          {entri.length === 0 ? (
            <EmptyState
              title="CV belum diisi"
              description="Tambahkan entri pendidikan, pengalaman, dan publikasi lewat panel admin."
            />
          ) : null}

          {CV_SECTION_ORDER.map((seksi) => {
            const list = perSeksi.get(seksi);
            if (!list || list.length === 0) return null;

            return (
              <section key={seksi}>
                <h2 className="eyebrow">{CV_SECTION_LABEL[seksi]}</h2>
                <ul className="mt-5 flex flex-col">
                  {list.map((e) => (
                    <li key={e.id} className="border-t border-border py-5">
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:gap-6">
                        <div>
                          <p className="font-display text-lg font-semibold leading-snug">
                            {e.url ? (
                              <a
                                href={e.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-underline inline-flex items-baseline gap-1"
                              >
                                {e.title_id}
                                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                              </a>
                            ) : (
                              e.title_id
                            )}
                          </p>
                          {e.organization ? (
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {e.organization}
                              {e.location ? ` · ${e.location}` : ""}
                            </p>
                          ) : null}
                          {e.description_id ? (
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {e.description_id}
                            </p>
                          ) : null}
                        </div>

                        {e.start_date ? (
                          <p className="shrink-0 text-sm text-subtle tabular-nums sm:text-right">
                            {formatDateRange(e.start_date, e.end_date, e.is_current)}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
