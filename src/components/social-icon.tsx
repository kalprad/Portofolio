import {
  Atom,
  Github,
  GraduationCap,
  Instagram,
  Linkedin,
  Link2,
  Twitter,
  Youtube,
} from "lucide-react";

/**
 * Ikon SVG untuk tautan sosial, ditebak dari labelnya sendiri — supaya
 * daftar tautan di panel admin tidak perlu kolom "jenis ikon" terpisah.
 * Jatuh ke ikon tautan umum kalau labelnya tidak dikenali.
 *
 * ResearchGate tidak punya ikon merek di pustaka ikon yang dipakai situs ini,
 * jadi dipetakan ke simbol atom sebagai gantinya.
 */
export function SocialIcon({ label, className }: { label: string; className?: string }) {
  const l = label.toLowerCase();

  if (l.includes("github")) return <Github className={className} aria-hidden />;
  if (l.includes("linkedin")) return <Linkedin className={className} aria-hidden />;
  if (l.includes("researchgate")) return <Atom className={className} aria-hidden />;
  if (l.includes("scholar")) return <GraduationCap className={className} aria-hidden />;
  if (l.includes("instagram")) return <Instagram className={className} aria-hidden />;
  if (l.includes("youtube")) return <Youtube className={className} aria-hidden />;
  if (l.includes("twitter") || l === "x") return <Twitter className={className} aria-hidden />;
  return <Link2 className={className} aria-hidden />;
}
