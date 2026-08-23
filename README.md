# Website pribadi — Rizki Haikal

Portofolio, tulisan, arsip kuliah, dan Ultraproduktif (arsip proyek pribadi
ala Notion). Satu sistem, tiga lapis akses, semuanya disunting lewat panel
admin (atau, khusus Ultraproduktif, langsung dari situsnya) tanpa menyentuh
kode.

| Lapis | Isi | Gerbang |
|---|---|---|
| Publik | Profil, CV, portofolio, tulisan | — |
| Semi-publik | Arsip kuliah S1 & S2 | Login Google berdomain UGM |
| Privat | Panel admin, dan Ultraproduktif (`/ultraproduktif`) | Login Google alamat pemilik |

**Stack.** Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 ·
Auth.js v5 · Vercel.

**Tidak ada database.** Repositori ini yang jadi databasenya.

---

## 1. Di mana data disimpan

Ada dua jenis data, dan keduanya punya tempat yang berbeda karena sifat
tulisannya berbeda.

### Konten → berkas di repositori

Profil, CV, portofolio, tulisan, dan metadata arsip hidup sebagai berkas di
folder `content/`. Semuanya jarang berubah dan selalu berubah karena Anda yang
menyuntingnya.

```
content/
├── profile.json                    identitas, kontak, tautan sosial
├── cv.json                         semua entri CV dalam satu larik
├── projects/<slug>.md              frontmatter + isi Markdown
├── posts/<slug>.md                 frontmatter + isi Markdown
└── archive/<slug>.json             satu mata kuliah + daftar berkasnya
```

Terjemahan Inggris tinggal di berkas berdampingan berakhiran `.en.md`, supaya
teks panjang tidak berdesakan di dalam frontmatter.

Keuntungan yang langsung terasa: setiap perubahan punya riwayat versi, bisa
dibandingkan lewat `git diff`, dan bisa dikembalikan lewat `git revert`.

### Jejak akses → Google Sheets

Catatan siapa mengunduh berkas apa **tidak bisa** disimpan di repositori. Satu
unduhan berarti satu tulisan baru; kalau disimpan sebagai berkas, satu
mahasiswa mengunduh berarti satu commit — ratusan mahasiswa berarti ratusan
commit sampah, kena rate limit GitHub, dan tabrakan tulis kalau dua orang
mengunduh bersamaan.

Karena itu jejak akses ditambahkan sebagai baris di Google Sheets, yang memang
menangani penambahan serentak dengan benar. Gratis, dan datanya tetap milik
sendiri.

---

## 2. Setup pertama kali

### 2.1 Pasang dependensi dan jalankan

```bash
npm install
```

```bash
npm run dev
```

Buka <http://localhost:3000>. Situsnya **langsung terisi** — konten contoh
sudah ada di `content/`, tidak ada layanan yang perlu disiapkan dulu.

### 2.2 Siapkan login Google

Ini yang membuka panel admin dan gerbang arsip UGM.

1. Buka [Google Cloud Console](https://console.cloud.google.com) → buat proyek.
2. **APIs & Services → OAuth consent screen** → pilih *External* → isi nama
   aplikasi dan email dukungan.
3. **Credentials → Create Credentials → OAuth client ID → Web application.**
4. Isi **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://DOMAIN-ANDA.vercel.app/api/auth/callback/google`
5. Salin Client ID dan Client Secret.

### 2.3 Isi variabel lingkungan

```bash
cp .env.example .env.local
```

Untuk `AUTH_SECRET`:

```bash
npx auth secret
```

Yang wajib diisi agar login bekerja: `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`, `ADMIN_EMAILS`. Sisanya opsional dan bisa menyusul.

Panel admin ada di `/admin` — masuk dengan alamat yang terdaftar di
`ADMIN_EMAILS`.

---

## 3. Cara panel admin menyimpan

Dua mode, dipilih otomatis.

**Lokal** — saat `npm run dev`. Perubahan langsung ditulis ke berkas di
`content/`, jadi hasilnya terlihat seketika. Commit sendiri lewat git seperti
biasa.

**GitHub** — di produksi. Setiap simpan menjadi satu commit lewat GitHub
Contents API, dan Vercel mendeteksinya lalu deploy ulang. Perubahan tampil di
situs publik sekitar satu menit setelah disimpan — panel admin memberi tahu hal
ini setelah menyimpan.

Untuk mode GitHub, buat token di GitHub → **Settings → Developer settings →
Personal access tokens → Fine-grained tokens**. Beri akses ke repositori ini
saja, dengan izin **Contents: Read and write**. Lalu isi `GITHUB_TOKEN`,
`GITHUB_OWNER`, dan `GITHUB_REPO`.

Setel `CONTENT_WRITE_MODE=github` kalau ingin menguji alur commit dari komputer
sendiri.

Halaman `/admin` menampilkan mode mana yang sedang aktif.

---

## 4. Cara kerja gerbang UGM

Pengunjung menekan **Masuk dengan Google** di halaman mata kuliah. Setelah
Google mengembalikan identitasnya, aplikasi memeriksa dua hal:

1. Google menandai alamat itu **terverifikasi** (`email_verified`). Tanpa
   pemeriksaan ini, domain UGM bisa diklaim akun yang emailnya belum terbukti.
2. Domainnya cocok dengan `UGM_EMAIL_DOMAINS`. Subdomain ikut diterima, jadi
   `ugm.ac.id` sudah mencakup `mail.ugm.ac.id` dan `student.ugm.ac.id`.

Hasilnya disimpan sebagai peran di dalam token sesi: `admin`, `ugm`, atau
`tamu`.

**Akun UGM Anda sendiri hilang setelah lulus — itu tidak masalah.** Yang login
di gerbang ini adalah pengunjung, bukan pemilik situs. Anda masuk lewat alamat
pribadi yang terdaftar di `ADMIN_EMAILS`, dan berkasnya ada di Drive pribadi
Anda. Verifikasi status mahasiswa terjadi di website, bukan di Drive.

### Yang bisa dan tidak bisa dijamin

Gerbang ini memastikan **hanya pemilik alamat UGM yang bisa memicu unduhan
lewat situs ini**, dan setiap percobaan tercatat. Yang tidak bisa dicegah oleh
sistem mana pun: seseorang yang sudah mengunduh berkasnya lalu membagikan
salinannya sendiri. Untuk itu, jejak akses di `/admin/log` adalah alat yang
Anda punya — Anda tahu siapa mengambil apa dan kapan.

---

## 5. Google Drive & Sheets

Satu service account melayani keduanya. Membuatnya sekali, dipakai dua kali.

1. Google Cloud Console → **IAM & Admin → Service Accounts → Create**.
2. Buat **Key** bertipe JSON, unduh berkasnya.
3. Aktifkan **Google Drive API** dan **Google Sheets API** di
   APIs & Services → Library.
4. Isi di `.env.local`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — nilai `client_email` dari JSON.
   - `GOOGLE_SERVICE_ACCOUNT_KEY` — nilai `private_key` dari JSON, ditulis satu
     baris dengan `\n` sebagai penanda baris baru.

### Berkas arsip (Drive)

**Mode proxy** — aktif kalau service account sudah disetel. Bagikan folder
materi ke alamat service account (`nama@proyek.iam.gserviceaccount.com`) sebagai
**Viewer**. Berkasnya boleh tetap privat: server yang mengambil isinya lalu
meneruskan byte-nya, sehingga URL Drive tidak pernah sampai ke peramban.

**Mode alih** — kalau service account belum disetel. Server tetap memverifikasi
dan mencatat, lalu mengalihkan ke tautan Drive. Berkas harus disetel *anyone
with the link*, dan URL aslinya bisa terlihat di panel jaringan peramban.

**Batas praktis.** Berkas ratusan MB memakan durasi fungsi dan kuota bandwidth
Vercel. Untuk berkas sebesar itu, isi kolom *Folder Drive* alih-alih *Berkas
Drive* — pengunjung akan dialihkan ke Drive setelah tetap diverifikasi dan
dicatat.

### Jejak akses (Sheets)

1. Buat satu spreadsheet baru.
2. Baris pertama diisi judul kolom:
   `Waktu · Email · Nama · Peran · Mata kuliah · Berkas · Hasil · IP (hash)`
3. Bagikan spreadsheet itu ke alamat service account sebagai **Editor**.
4. Salin ID-nya dari URL — `docs.google.com/spreadsheets/d/<ID>/edit` — lalu isi
   `GOOGLE_SHEETS_LOG_ID`.

Alamat IP disimpan sebagai hash SHA-256, bukan nilai aslinya. Isi `LOG_IP_SALT`
dengan teks acak apa saja.

Tanpa ini gerbang UGM tetap berfungsi — yang hilang hanya catatan siapa
mengunduh apa.

---

## 6. Panel admin

| Halaman | Isi |
|---|---|
| `/admin` | Ringkasan angka, aksi cepat, status integrasi, jejak terakhir |
| `/admin/profil` | Nama, headline, deskripsi diri, kontak, foto, berkas CV |
| `/admin/cv` | Entri pendidikan, pengalaman, publikasi, keahlian, dst. |
| `/admin/portofolio` | Proyek — draf atau terbit, bisa ditandai pilihan |
| `/admin/tulisan` | Tulisan dengan tiga tingkat privasi |
| `/admin/arsip` | Mata kuliah dan berkasnya |
| `/admin/log` | Jejak siapa mengunduh apa |

**Ultraproduktif bukan bagian dari panel admin** — ia hidup di `/ultraproduktif`, dibungkus tampilan situs publik seperti biasa (bukan tampilan panel admin), dan cuma muncul di menu header kalau yang sedang login adalah pemilik situs. Lihat §10.

### Tiga tingkat privasi tulisan

- **Draf privat** — tidak pernah keluar dari `content/` ke halaman publik.
- **Tak terdaftar** — bisa dibuka lewat tautan langsung, tidak muncul di
  daftar, memasang `noindex`, dan tidak masuk sitemap.
- **Publik** — tampil di daftar dan diindeks mesin pencari.

### Menambah kolom baru

Semua formulir dibangkitkan dari `src/lib/admin-schema.ts`. Menambah kolom
cukup: tambahkan satu entri di berkas itu, lalu pastikan pembacaannya ada di
`src/lib/content.ts`. Formulir, validasi, dan tabel daftar mengikuti otomatis.

---

## 7. Deploy ke Vercel

1. `git init`, commit, push ke GitHub.
2. Di Vercel: **Add New → Project** → pilih repo → Framework otomatis terdeteksi
   sebagai Next.js.
3. **Settings → Environment Variables**: isi semua nilai dari `.env.local`.
   Ubah `NEXT_PUBLIC_SITE_URL` ke domain produksi.
4. Tambahkan redirect URI produksi di Google Cloud Console (lihat §2.2).
5. Deploy.

Karena panel admin menyimpan lewat commit, alur suntingnya menjadi:
sunting → commit otomatis → Vercel deploy ulang → perubahan tampil.

---

## 8. Struktur berkas

```
content/                  ← databasenya ada di sini
src/
├── app/
│   ├── (situs)/          # Halaman publik — punya header & footer
│   │   ├── page.tsx              beranda
│   │   ├── tentang/ cv/          profil & CV
│   │   ├── portofolio/           daftar + detail
│   │   ├── tulisan/               daftar + detail
│   │   ├── arsip/                daftar + detail (bergerbang)
│   │   ├── masuk/                halaman login
│   │   └── ultraproduktif/       Ultraproduktif (§10) — dijaga middleware, bukan halaman admin
│   ├── admin/            # Panel admin — layout & penjaga sendiri
│   │   └── actions.ts             menulis balik ke content/
│   ├── api/
│   │   ├── auth/                  Auth.js
│   │   ├── arsip/[itemId]/unduh/  satu-satunya jalan ke berkas
│   │   └── cron/sinkron-kalender/ sisi "masuk" sinkron dua arah Calendar
│   └── actions/          # Server action masuk/keluar
├── components/
│   ├── ui/primitives.tsx # Tombol, isian, badge, wadah
│   ├── admin/            # Formulir generik, tabel, navigasi
│   ├── kerja/            # Papan Kanban, catatan, jadwal, sidebar area Kerja
│   └── …                 # Header, footer, kartu, gerbang UGM
└── lib/
    ├── content.ts        # Baca konten dari berkas
    ├── content-write.ts  # Tulis balik: disk (dev) atau commit (produksi)
    ├── google.ts         # Kredensial service account bersama
    ├── drive.ts          # Dua mode akses Drive
    ├── sheets.ts         # Jejak akses
    ├── sheets-db.ts       # Mesin baca-tulis Sheets generik, dasar area Kerja
    ├── calendar.ts        # Sinkron dua arah Google Calendar
    ├── workspace-sheets.ts   # CRUD area Kerja di atas Sheets
    ├── workspace-actions.ts  # Server action area Kerja + dorong ke Calendar
    ├── workspace-types.ts    # Bentuk data area Kerja
    ├── workspace-utils.ts    # Format tanggal/jam, agenda gabungan
    ├── email.ts              # Kirim email lewat SMTP Gmail
    ├── email-templates.ts    # Templat HTML ringkasan proyek
    ├── auth.ts           # Peran & aturan domain UGM
    ├── queries.ts        # Baca untuk halaman publik
    ├── admin-queries.ts  # Baca untuk panel (termasuk draf)
    ├── admin-schema.ts   # Definisi formulir — satu sumber kebenaran
    └── i18n.ts           # Kerangka dua bahasa
```

---

## 9. Dua bahasa

Fase 1 berjalan dalam Bahasa Indonesia. Kerangkanya sudah terpasang penuh:

- Setiap kolom teks yang tampil ke pengunjung punya pasangan `_id` dan `_en`.
- Semua halaman mengambil teks lewat `pick(row, "field", locale)`, yang jatuh
  kembali ke Bahasa Indonesia kalau terjemahannya kosong.
- Panel admin sudah punya bagian **Terjemahan Inggris** di setiap formulir,
  ditutup secara bawaan.

Menyalakan versi Inggris nanti: isi kolom `_en`, ubah `ENABLED_LOCALES` di
`src/lib/i18n.ts` menjadi `["id", "en"]`, lalu tampilkan pemilih bahasa di
header.

---

## 10. Ultraproduktif (fase 2)

`/ultraproduktif` adalah arsip proyek pribadi ala Notion: proyek, papan tugas
(Kanban), catatan/materi per proyek, dan jadwal — semuanya dua arah dengan
Google Calendar. Beda dari `/admin/*`, halaman ini dibungkus tampilan situs
publik biasa (header & footer situs, bukan tampilan panel admin) — tautannya
muncul di header, di sebelah CV, tapi cuma kalau yang login adalah pemilik
situs. Sampai langkah setup di bawah selesai, halamannya tetap bisa dibuka
dan cuma menampilkan petunjuk setup — tidak error.

**Kenapa datanya bukan di `content/` seperti konten lain.** Tugas dicentang,
kartu digeser, catatan direvisi — semua bisa berkali-kali dalam satu hari.
Kalau disimpan sebagai berkas git seperti proyek/tulisan, setiap perubahan
kecil jadi satu commit dan harus menunggu Vercel deploy ulang (±1 menit)
sebelum kelihatan. Jadi semuanya (termasuk catatan, bukan cuma checklist)
disimpan di satu spreadsheet Google Sheets terpisah — sama alasannya dengan
jejak akses di §5, cuma datanya lebih banyak jenisnya.

### 10.1 Siapkan spreadsheet-nya

1. Buat satu spreadsheet Google Sheets baru (terpisah dari spreadsheet jejak
   akses di §5).
2. Buat 5 tab (klik tanda **+** di pojok kiri bawah), beri nama PERSIS seperti
   ini, dan isi baris pertama tiap tab dengan judul kolom berikut:

   | Nama tab | Judul kolom (baris pertama) |
   |---|---|
   | `Proyek` | `id, judul, deskripsi, status, warna, dibuat_pada, diubah_pada, dihapus` |
   | `Tugas` | `id, proyek_id, judul, deskripsi, status, prioritas, tenggat, urutan, calendar_event_id, calendar_diubah_pada, dibuat_pada, diubah_pada, dihapus` |
   | `Catatan` | `id, proyek_id, judul, isi, dibuat_pada, diubah_pada, dihapus` |
   | `Jadwal` | `id, proyek_id, judul, deskripsi, mulai, selesai, lokasi, calendar_event_id, calendar_diubah_pada, dibuat_pada, diubah_pada, dihapus` |
   | `Sinkron` | `kunci, nilai` |

3. Bagikan spreadsheet-nya ke alamat service account yang sama dipakai
   Drive/Sheets (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, lihat §5) sebagai **Editor**.
4. Salin ID-nya dari URL — `docs.google.com/spreadsheets/d/<ID>/edit` — lalu
   isi `GOOGLE_SHEETS_KERJA_ID`.

Kolom `dihapus` bukan salah ketik — item yang "dihapus" cuma ditandai di
kolom itu, barisnya tidak sungguh-sungguh dibuang, supaya baris lain tidak
ikut bergeser nomornya.

### 10.2 Siapkan sinkron Google Calendar

Sinkronnya **dua arah**: tugas bertenggat & jadwal yang dibuat di situs
otomatis muncul di Calendar, dan sebaliknya — edit langsung di Calendar
(misalnya dari HP) ikut masuk balik ke situs saat sinkron berjalan.

1. Buat kalender Google baru (atau pakai yang sudah ada) — di Google
   Calendar, klik **+** di samping "Kalender lain" → **Buat kalender baru**.
2. Buka **Setelan dan berbagi** kalender itu → bagian **Bagikan dengan orang
   tertentu** → tambahkan alamat service account (`GOOGLE_SERVICE_ACCOUNT_EMAIL`)
   dengan izin **"Membuat perubahan pada acara"** (bukan cuma "Melihat").
3. Masih di halaman setelan yang sama, salin **"ID kalender integrasi"** —
   bentuknya seperti alamat email panjang berakhiran
   `@group.calendar.google.com`, BUKAN kata `primary`.
4. Isi `GOOGLE_CALENDAR_ID` dengan ID itu.

### 10.3 Sinkron masuk berjalan lewat cron

Sisi "situs → Calendar" terjadi seketika setiap tugas/jadwal disimpan. Sisi
sebaliknya ("Calendar → situs") diperiksa berkala oleh Vercel Cron, sudah
disetel di `vercel.json` (sekali sehari — lihat catatan di bawah), memanggil
`/api/cron/sinkron-kalender`.

**Catatan paket Vercel gratis (Hobby):** cron di paket ini CUMA BOLEH jalan
sekali sehari — jadwal yang lebih sering dari itu bikin deployment langsung
gagal (bukan cuma dibatasi, tapi ditolak total). Karena itu `vercel.json` di
sini disetel `0 23 * * *` (jam 23:00 UTC = 06:00 WIB, sekali sehari). Kalau
butuh sinkron lebih cepat dari itu, pakai tombol **"Sinkron Calendar
sekarang"** di `/ultraproduktif` buat memicu manual selagi masuk sebagai admin,
atau naik ke paket Pro (cron per-menit) kalau sinkron real-time penting.

Opsional: isi `CRON_SECRET` dengan teks acak supaya endpoint sinkron tidak
bisa dipicu sembarang orang — Vercel otomatis mengirim nilai itu tiap
memanggil cron-nya sendiri.

### 10.4 Kirim ringkasan proyek lewat email

Tombol **"Kirim ringkasan"** di halaman tiap proyek merangkum papan tugas,
catatan, dan jadwal terkait jadi satu email HTML, dikirim ke alamat pilihan
lo (kosongkan kolomnya untuk kirim ke email akun yang sedang login).

Pengirimnya lewat SMTP Gmail akun pribadi — bukan daftar ke layanan pihak
ketiga baru (Resend, SendGrid, dst). Setupnya:

1. Nyalakan **2-Step Verification** di akun Google yang mau dipakai ngirim
   (Setelan Akun Google → Keamanan → Verifikasi 2 Langkah) — App Password
   tidak bisa dibuat tanpa ini aktif dulu.
2. Buka **[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)**,
   bikin App Password baru, kasih nama bebas misal "Ultraproduktif". Google
   kasih kode 16 karakter — copy itu (cuma ditampilkan sekali).
3. Isi di environment variable:
   - `EMAIL_SMTP_USER` — alamat Gmail yang dipakai (boleh sama dengan
     `ADMIN_EMAILS`, boleh beda).
   - `EMAIL_SMTP_PASSWORD` — kode 16 karakter dari langkah 2 (BUKAN password
     akun Google biasa — password akun biasa tidak akan diterima).

Batas kirim akun Gmail biasa adalah 500 email/hari, jauh lebih dari cukup
untuk kirim ringkasan sesekali.

---

## 11. Perintah

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run typecheck
```
