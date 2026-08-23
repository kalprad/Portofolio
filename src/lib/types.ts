/**
 * Bentuk konten sebagaimana dibaca dari berkas di folder `content/`.
 *
 * `id` bukan kunci database melainkan turunan nama berkas: slug untuk proyek,
 * tulisan, dan mata kuliah; `<slug>--<id-lokal>` untuk butir arsip.
 */

export type PublishStatus = "draft" | "published";
export type PostVisibility = "private" | "unlisted" | "public";
export type StudyLevel = "s1" | "s2" | "umum";
export type ArchiveAccess = "public" | "ugm";
export type CvSection =
  | "pendidikan" | "pengalaman" | "publikasi" | "penghargaan"
  | "sertifikasi" | "keahlian" | "organisasi";
export type ArchiveKind =
  | "slide" | "buku" | "catatan" | "soal" | "tugas"
  | "spreadsheet" | "kode" | "video" | "lainnya";

/** Peran pengguna yang login. `tamu` = sudah login Google tapi bukan UGM/admin. */
export type Role = "admin" | "ugm" | "tamu";

export interface SocialLink {
  label: string;
  url: string;
  icon?: string;
}

export interface GalleryImage {
  url: string;
  caption?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  headline_id: string;
  headline_en: string | null;
  bio_id: string | null;
  bio_en: string | null;
  tagline_id: string | null;
  tagline_en: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  cv_file_url: string | null;
  social_links: SocialLink[];
  updated_at: string;
}

export interface CvEntry {
  id: string;
  section: CvSection;
  title_id: string;
  title_en: string | null;
  organization: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description_id: string | null;
  description_en: string | null;
  url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  slug: string;
  title_id: string;
  title_en: string | null;
  summary_id: string | null;
  summary_en: string | null;
  body_id: string | null;
  body_en: string | null;
  role: string | null;
  client: string | null;
  location: string | null;
  year_start: number | null;
  year_end: number | null;
  category: string | null;
  tags: string[];
  cover_image_url: string | null;
  gallery: GalleryImage[];
  external_url: string | null;
  is_featured: boolean;
  status: PublishStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  slug: string;
  title_id: string;
  title_en: string | null;
  excerpt_id: string | null;
  excerpt_en: string | null;
  body_id: string | null;
  body_en: string | null;
  cover_image_url: string | null;
  tags: string[];
  category: string | null;
  visibility: PostVisibility;
  published_at: string | null;
  reading_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface ArchiveCollection {
  id: string;
  slug: string;
  title_id: string;
  title_en: string | null;
  description_id: string | null;
  description_en: string | null;
  level: StudyLevel;
  semester: number | null;
  course_code: string | null;
  credits: number | null;
  lecturer: string | null;
  cover_image_url: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArchiveItem {
  id: string;
  collection_id: string;
  title_id: string;
  title_en: string | null;
  description_id: string | null;
  kind: ArchiveKind;
  drive_file_id: string | null;
  drive_folder_id: string | null;
  external_url: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  access_level: ArchiveAccess;
  sort_order: number;
  is_published: boolean;
}

/** Label tampilan untuk nilai enum. */
export const CV_SECTION_LABEL: Record<CvSection, string> = {
  pendidikan: "Pendidikan",
  pengalaman: "Pengalaman",
  publikasi: "Publikasi",
  penghargaan: "Penghargaan",
  sertifikasi: "Sertifikasi",
  keahlian: "Keahlian",
  organisasi: "Organisasi",
};

export const CV_SECTION_ORDER: CvSection[] = [
  "pendidikan", "pengalaman", "publikasi",
  "penghargaan", "sertifikasi", "keahlian", "organisasi",
];

export const ARCHIVE_KIND_LABEL: Record<ArchiveKind, string> = {
  slide: "Slide",
  buku: "Buku / Modul",
  catatan: "Catatan",
  soal: "Bank Soal",
  tugas: "Tugas",
  spreadsheet: "Spreadsheet",
  kode: "Kode",
  video: "Video",
  lainnya: "Lainnya",
};

export const LEVEL_LABEL: Record<StudyLevel, string> = {
  s1: "S1",
  s2: "S2",
  umum: "Umum",
};

export const VISIBILITY_LABEL: Record<PostVisibility, string> = {
  public: "Publik",
  unlisted: "Tak terdaftar",
  private: "Draf privat",
};
