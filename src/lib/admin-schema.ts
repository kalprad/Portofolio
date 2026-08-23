/**
 * Definisi sumber daya panel admin.
 *
 * Satu berkas ini yang menentukan kolom apa saja yang bisa disunting, jenis
 * isiannya, dan aturan validasinya. Menambah kolom baru cukup dilakukan di
 * sini — formulir, tabel daftar, dan server action mengikuti otomatis.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "number"
  | "date"
  | "datetime"
  | "select"
  | "checkbox"
  | "tags"
  | "url"
  | "drive"
  | "image"
  | "sociallinks";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Kolom `_en` yang belum wajib diisi di fase 1. */
  translation?: boolean;
  /** Isi otomatis dari kolom lain kalau dibiarkan kosong. */
  slugFrom?: string;
  group?: string;
  full?: boolean;
}

export interface ResourceDef {
  key: string;
  table: string;
  singular: string;
  plural: string;
  basePath: string;
  titleField: string;
  /** Kolom yang ditampilkan sebagai keterangan tambahan di tabel daftar. */
  metaFields?: string[];
  order: { column: string; ascending: boolean };
  fields: FieldDef[];
}

const TERJEMAHAN_HINT = "Opsional. Diisi nanti saat versi Inggris dinyalakan.";

// --- Portofolio ---------------------------------------------------------------

const projects: ResourceDef = {
  key: "projects",
  table: "projects",
  singular: "Proyek",
  plural: "Portofolio",
  basePath: "/admin/portofolio",
  titleField: "title_id",
  metaFields: ["category", "status"],
  order: { column: "sort_order", ascending: true },
  fields: [
    { name: "title_id", label: "Judul", type: "text", required: true, group: "Isi" },
    { name: "slug", label: "Slug URL", type: "text", slugFrom: "title_id", hint: "Dibiarkan kosong akan dibuat otomatis dari judul.", group: "Isi" },
    { name: "summary_id", label: "Ringkasan", type: "textarea", hint: "Satu sampai dua kalimat. Tampil di kartu daftar.", full: true, group: "Isi" },
    { name: "body_id", label: "Isi lengkap", type: "markdown", hint: "Format Markdown. Gunakan ## untuk subjudul.", full: true, group: "Isi" },

    { name: "title_en", label: "Judul (EN)", type: "text", translation: true, hint: TERJEMAHAN_HINT, group: "Terjemahan" },
    { name: "summary_en", label: "Ringkasan (EN)", type: "textarea", translation: true, full: true, group: "Terjemahan" },
    { name: "body_en", label: "Isi lengkap (EN)", type: "markdown", translation: true, full: true, group: "Terjemahan" },

    { name: "role", label: "Peran saya", type: "text", placeholder: "Peneliti utama", group: "Detail" },
    { name: "client", label: "Pemberi kerja", type: "text", group: "Detail" },
    { name: "location", label: "Lokasi", type: "text", group: "Detail" },
    { name: "category", label: "Kategori", type: "text", placeholder: "Rekayasa Struktur", hint: "Dipakai sebagai penyaring di halaman portofolio.", group: "Detail" },
    { name: "year_start", label: "Tahun mulai", type: "number", group: "Detail" },
    { name: "year_end", label: "Tahun selesai", type: "number", group: "Detail" },
    { name: "tags", label: "Kata kunci", type: "tags", hint: "Pisahkan dengan koma.", full: true, group: "Detail" },

    { name: "cover_image_url", label: "Gambar sampul", type: "image", full: true, group: "Media & terbit" },
    { name: "external_url", label: "Tautan terkait", type: "url", full: true, group: "Media & terbit" },
    {
      name: "status", label: "Status", type: "select", required: true, group: "Media & terbit",
      options: [
        { value: "draft", label: "Draf — belum tampil" },
        { value: "published", label: "Terbit — tampil di situs" },
      ],
    },
    { name: "is_featured", label: "Tampilkan di beranda sebagai proyek pilihan", type: "checkbox", full: true, group: "Media & terbit" },
    { name: "sort_order", label: "Urutan", type: "number", hint: "Angka kecil tampil lebih dulu.", group: "Media & terbit" },
  ],
};

// --- Tulisan ------------------------------------------------------------------

const posts: ResourceDef = {
  key: "posts",
  table: "posts",
  singular: "Tulisan",
  plural: "Tulisan",
  basePath: "/admin/tulisan",
  titleField: "title_id",
  metaFields: ["category", "visibility"],
  order: { column: "created_at", ascending: false },
  fields: [
    { name: "title_id", label: "Judul", type: "text", required: true, group: "Isi" },
    { name: "slug", label: "Slug URL", type: "text", slugFrom: "title_id", hint: "Dibiarkan kosong akan dibuat otomatis dari judul.", group: "Isi" },
    { name: "excerpt_id", label: "Cuplikan", type: "textarea", hint: "Tampil di daftar dan pratinjau tautan.", full: true, group: "Isi" },
    { name: "body_id", label: "Isi tulisan", type: "markdown", hint: "Format Markdown.", full: true, group: "Isi" },

    { name: "title_en", label: "Judul (EN)", type: "text", translation: true, hint: TERJEMAHAN_HINT, group: "Terjemahan" },
    { name: "excerpt_en", label: "Cuplikan (EN)", type: "textarea", translation: true, full: true, group: "Terjemahan" },
    { name: "body_en", label: "Isi tulisan (EN)", type: "markdown", translation: true, full: true, group: "Terjemahan" },

    { name: "category", label: "Kategori", type: "text", placeholder: "Teknik / Curhat / Catatan", group: "Detail" },
    { name: "tags", label: "Kata kunci", type: "tags", hint: "Pisahkan dengan koma.", group: "Detail" },
    { name: "cover_image_url", label: "Gambar sampul", type: "image", full: true, group: "Detail" },

    {
      name: "visibility", label: "Tingkat privasi", type: "select", required: true, group: "Terbit",
      options: [
        { value: "private", label: "Draf privat — hanya Anda yang bisa lihat" },
        { value: "unlisted", label: "Tak terdaftar — bisa dibuka lewat tautan, tidak masuk daftar & mesin pencari" },
        { value: "public", label: "Publik — tampil di daftar dan diindeks" },
      ],
    },
    { name: "published_at", label: "Waktu terbit", type: "datetime", hint: "Kosongkan untuk mengisi otomatis saat status dijadikan publik.", group: "Terbit" },
  ],
};

// --- CV -----------------------------------------------------------------------

const cvEntries: ResourceDef = {
  key: "cv",
  table: "cv_entries",
  singular: "Entri CV",
  plural: "CV",
  basePath: "/admin/cv",
  titleField: "title_id",
  metaFields: ["section", "organization"],
  order: { column: "sort_order", ascending: true },
  fields: [
    {
      name: "section", label: "Bagian", type: "select", required: true, group: "Isi",
      options: [
        { value: "pendidikan", label: "Pendidikan" },
        { value: "pengalaman", label: "Pengalaman" },
        { value: "publikasi", label: "Publikasi" },
        { value: "penghargaan", label: "Penghargaan" },
        { value: "sertifikasi", label: "Sertifikasi" },
        { value: "keahlian", label: "Keahlian" },
        { value: "organisasi", label: "Organisasi" },
      ],
    },
    { name: "title_id", label: "Judul", type: "text", required: true, group: "Isi" },
    { name: "organization", label: "Institusi / penerbit", type: "text", group: "Isi" },
    { name: "location", label: "Lokasi", type: "text", group: "Isi" },
    { name: "description_id", label: "Keterangan", type: "textarea", full: true, group: "Isi", hint: "Untuk bagian Keahlian, tulis daftar dipisah koma — akan tampil sebagai label." },

    { name: "title_en", label: "Judul (EN)", type: "text", translation: true, hint: TERJEMAHAN_HINT, group: "Terjemahan" },
    { name: "description_en", label: "Keterangan (EN)", type: "textarea", translation: true, full: true, group: "Terjemahan" },

    { name: "start_date", label: "Tanggal mulai", type: "date", group: "Waktu & urutan" },
    { name: "end_date", label: "Tanggal selesai", type: "date", group: "Waktu & urutan" },
    { name: "is_current", label: "Masih berjalan sampai sekarang", type: "checkbox", full: true, group: "Waktu & urutan" },
    { name: "url", label: "Tautan", type: "url", full: true, group: "Waktu & urutan" },
    { name: "sort_order", label: "Urutan", type: "number", hint: "Angka kecil tampil lebih dulu di dalam bagiannya.", group: "Waktu & urutan" },
    { name: "is_published", label: "Tampilkan di halaman CV", type: "checkbox", full: true, group: "Waktu & urutan" },
  ],
};

// --- Arsip: mata kuliah -------------------------------------------------------

const archiveCollections: ResourceDef = {
  key: "arsip",
  table: "archive_collections",
  singular: "Mata Kuliah",
  plural: "Arsip Kuliah",
  basePath: "/admin/arsip",
  titleField: "title_id",
  metaFields: ["level", "course_code"],
  order: { column: "sort_order", ascending: true },
  fields: [
    { name: "title_id", label: "Nama mata kuliah", type: "text", required: true, group: "Isi" },
    { name: "slug", label: "Slug URL", type: "text", slugFrom: "title_id", group: "Isi" },
    { name: "description_id", label: "Keterangan", type: "textarea", full: true, group: "Isi" },

    { name: "title_en", label: "Nama (EN)", type: "text", translation: true, hint: TERJEMAHAN_HINT, group: "Terjemahan" },
    { name: "description_en", label: "Keterangan (EN)", type: "textarea", translation: true, full: true, group: "Terjemahan" },

    {
      name: "level", label: "Jenjang", type: "select", required: true, group: "Detail",
      options: [
        { value: "s1", label: "S1" },
        { value: "s2", label: "S2" },
        { value: "umum", label: "Umum" },
      ],
    },
    { name: "semester", label: "Semester", type: "number", group: "Detail" },
    { name: "course_code", label: "Kode mata kuliah", type: "text", placeholder: "TKS2101", group: "Detail" },
    { name: "credits", label: "SKS", type: "number", group: "Detail" },
    { name: "lecturer", label: "Dosen pengampu", type: "text", group: "Detail" },
    { name: "sort_order", label: "Urutan", type: "number", group: "Detail" },
    { name: "is_published", label: "Tampilkan di halaman arsip publik", type: "checkbox", full: true, group: "Detail" },
  ],
};

// --- Arsip: berkas ------------------------------------------------------------

const archiveItems: ResourceDef = {
  key: "berkas",
  table: "archive_items",
  singular: "Berkas",
  plural: "Berkas Arsip",
  basePath: "/admin/arsip/berkas",
  titleField: "title_id",
  metaFields: ["kind", "access_level"],
  order: { column: "sort_order", ascending: true },
  fields: [
    { name: "collection_id", label: "Mata kuliah", type: "select", required: true, options: [], group: "Isi" },
    { name: "title_id", label: "Nama berkas", type: "text", required: true, group: "Isi" },
    { name: "description_id", label: "Keterangan", type: "textarea", full: true, group: "Isi" },
    {
      name: "kind", label: "Jenis", type: "select", required: true, group: "Isi",
      options: [
        { value: "slide", label: "Slide" },
        { value: "buku", label: "Buku / Modul" },
        { value: "catatan", label: "Catatan" },
        { value: "soal", label: "Bank Soal" },
        { value: "tugas", label: "Tugas" },
        { value: "spreadsheet", label: "Spreadsheet" },
        { value: "kode", label: "Kode" },
        { value: "video", label: "Video" },
        { value: "lainnya", label: "Lainnya" },
      ],
    },

    {
      name: "drive_file_id", label: "Berkas Drive", type: "drive", full: true, group: "Sumber berkas",
      hint: "Tempel URL Drive atau ID-nya langsung — keduanya diterima. Nilai ini tidak pernah dirender ke halaman publik.",
    },
    {
      name: "drive_folder_id", label: "Folder Drive", type: "drive", full: true, group: "Sumber berkas",
      hint: "Isi ini kalau butirnya berupa folder, bukan satu berkas. Folder tidak bisa diproksi — pengunjung akan dialihkan ke Drive.",
    },
    { name: "external_url", label: "Tautan luar", type: "url", full: true, group: "Sumber berkas", hint: "Alternatif kalau materinya tidak di Drive." },
    { name: "mime_type", label: "Tipe berkas", type: "text", placeholder: "application/pdf", group: "Sumber berkas" },
    { name: "file_size_bytes", label: "Ukuran (byte)", type: "number", group: "Sumber berkas" },

    {
      name: "access_level", label: "Siapa yang boleh mengunduh", type: "select", required: true, group: "Akses",
      options: [
        { value: "ugm", label: "Hanya akun UGM terverifikasi" },
        { value: "public", label: "Siapa saja" },
      ],
    },
    { name: "sort_order", label: "Urutan", type: "number", group: "Akses" },
    { name: "is_published", label: "Tampilkan berkas ini", type: "checkbox", full: true, group: "Akses" },
  ],
};

// --- Profil (baris tunggal) ---------------------------------------------------

const profile: ResourceDef = {
  key: "profil",
  table: "profile",
  singular: "Profil",
  plural: "Profil",
  basePath: "/admin/profil",
  titleField: "full_name",
  order: { column: "updated_at", ascending: false },
  fields: [
    { name: "full_name", label: "Nama lengkap", type: "text", required: true, group: "Identitas" },
    { name: "headline_id", label: "Headline", type: "text", required: true, placeholder: "Structural Engineer & Researcher", group: "Identitas" },
    { name: "tagline_id", label: "Tagline", type: "text", hint: "Satu kalimat di bawah judul besar beranda.", full: true, group: "Identitas" },
    { name: "bio_id", label: "Deskripsi diri", type: "markdown", hint: "Format Markdown. Tampil di halaman Tentang.", full: true, group: "Identitas" },

    { name: "headline_en", label: "Headline (EN)", type: "text", translation: true, hint: TERJEMAHAN_HINT, group: "Terjemahan" },
    { name: "tagline_en", label: "Tagline (EN)", type: "text", translation: true, full: true, group: "Terjemahan" },
    { name: "bio_en", label: "Deskripsi diri (EN)", type: "markdown", translation: true, full: true, group: "Terjemahan" },

    { name: "location", label: "Lokasi", type: "text", group: "Kontak" },
    { name: "email", label: "Email", type: "text", group: "Kontak" },
    { name: "phone", label: "Telepon", type: "text", group: "Kontak" },
    { name: "cv_file_url", label: "URL berkas CV (PDF)", type: "url", full: true, group: "Kontak" },

    {
      name: "avatar_url", label: "Foto formal", type: "image", full: true, group: "Foto",
      hint: "Dipakai di halaman Tentang dan kepala CV.",
    },
    {
      name: "hero_photo_url", label: "Foto santai", type: "image", full: true, group: "Foto",
      hint: "Dipakai di beranda, di samping nama Anda.",
    },

    {
      name: "social_links", label: "Tautan sosial", type: "sociallinks", full: true, group: "Tautan sosial",
      hint: "Tampil di beranda dan kaki setiap halaman. Ikon ditebak otomatis dari labelnya.",
    },
  ],
};

export const RESOURCES: Record<string, ResourceDef> = {
  projects,
  posts,
  cv: cvEntries,
  arsip: archiveCollections,
  berkas: archiveItems,
  profil: profile,
};

export function getResource(key: string): ResourceDef {
  const r = RESOURCES[key];
  if (!r) throw new Error(`Sumber daya admin tidak dikenal: ${key}`);
  return r;
}

/** Urutan grup yang dipakai formulir, supaya tampil konsisten. */
export function fieldGroups(resource: ResourceDef): { name: string; fields: FieldDef[] }[] {
  const urutan: string[] = [];
  const peta = new Map<string, FieldDef[]>();

  for (const f of resource.fields) {
    const g = f.group ?? "Umum";
    if (!peta.has(g)) {
      peta.set(g, []);
      urutan.push(g);
    }
    peta.get(g)!.push(f);
  }

  return urutan.map((name) => ({ name, fields: peta.get(name)! }));
}
