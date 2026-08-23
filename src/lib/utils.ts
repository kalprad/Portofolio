import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "Agustus 2026" — cukup untuk CV dan portofolio. */
export function formatMonthYear(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "12 Agustus 2026" — untuk tanggal terbit tulisan. */
export function formatFullDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${BULAN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "Agustus 2024 — Sekarang" atau "2020 — 2024". */
export function formatDateRange(
  start?: string | null,
  end?: string | null,
  isCurrent = false,
): string {
  const a = formatMonthYear(start);
  if (!a) return "";
  const b = isCurrent ? "Sekarang" : formatMonthYear(end);
  return b ? `${a} — ${b}` : a;
}

export function formatYearRange(start?: number | null, end?: number | null): string {
  if (!start) return "";
  if (!end || end === start) return String(start);
  return `${start}—${end}`;
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Angka besar dibaca lebih enak dengan pemisah ribuan. */
export function formatCount(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Perkiraan waktu baca, 200 kata per menit. */
export function readingMinutes(markdown?: string | null): number {
  if (!markdown) return 1;
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
