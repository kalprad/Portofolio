import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * Relai unggah lampiran Catatan — peramban PUT tiap POTONGAN berkas ke SINI
 * (sesama domain), lalu di sini kita teruskan ke sesi resumable upload Drive.
 *
 * Kenapa tidak PUT langsung dari peramban ke Drive: sempat dicoba begitu,
 * tapi Google Drive tidak mengizinkan CORS untuk PUT resumable upload dari
 * origin sembarang — peramban memblokirnya sebelum permintaan terkirim sama
 * sekali (muncul sebagai galat jaringan generik, padahal bukan soal koneksi).
 * Server-ke-server tidak kena aturan CORS (itu aturan khusus peramban), jadi
 * relai satu langkah ini menyelesaikannya.
 *
 * Kenapa DIPOTONG-POTONG (bukan satu PUT berisi seluruh berkas): batas ukuran
 * request Vercel Functions (~4,5 MB) TERNYATA tetap berlaku walau Edge
 * runtime dan body-nya diteruskan sebagai stream — sempat dikira lolos, tapi
 * di produksi tetap kena 413 buat berkas besar. Jalan keluarnya justru
 * protokol resumable upload Drive yang sebenarnya: klien memotong berkas jadi
 * beberapa bagian kecil (lihat `catatan-panel.tsx`), tiap bagian dikirim
 * sebagai request TERPISAH ke sini — masing-masing jauh di bawah batas — dan
 * Drive menyambung-nyambungkannya sendiri di sisi mereka berdasar sesi + posisi
 * byte (`Content-Range`) tiap potongan.
 *
 * Route API tidak dijaga middleware (lihat `middleware.ts`), jadi otorisasi
 * dicek manual di sini — pola yang sama dipakai `/api/arsip/[itemId]/unduh`.
 */

export const runtime = "edge";

const AWALAN_URL_SAH = "https://www.googleapis.com/upload/drive/v3/files";

export async function POST(request: NextRequest) {
  const sesi = await requireAdmin();
  if (!sesi) {
    return NextResponse.json({ error: "Tidak berwenang." }, { status: 401 });
  }

  const sesiUrl = request.headers.get("x-sesi-url");
  // Batasi target relai ke endpoint upload Drive saja — tanpa ini, siapa pun
  // yang bisa memanggil route ini bisa memaksa server kita PUT byte apa saja
  // ke URL mana saja (SSRF).
  if (!sesiUrl || !sesiUrl.startsWith(AWALAN_URL_SAH)) {
    return NextResponse.json({ error: "URL sesi unggah tidak sah." }, { status: 400 });
  }

  // "Content-Length"/"Content-Range" untuk POTONGAN INI — klien yang
  // menghitung & mengirim posisi byte-nya (lihat `catatan-panel.tsx`) karena
  // dialah yang memotong berkasnya, tahu persis batas tiap bagian.
  const total = Number(request.headers.get("x-berkas-ukuran"));
  const mulai = Number(request.headers.get("x-potongan-mulai"));
  const akhir = Number(request.headers.get("x-potongan-akhir"));
  if (![total, mulai, akhir].every(Number.isFinite) || total <= 0 || mulai < 0 || akhir < mulai) {
    return NextResponse.json({ error: "Header posisi potongan tidak sah." }, { status: 400 });
  }

  const isi = await request.arrayBuffer();

  try {
    const hulu = await fetch(sesiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/octet-stream",
        "Content-Range": `bytes ${mulai}-${akhir}/${total}`,
      },
      body: isi,
    });

    // 308 = potongan diterima, Drive minta lanjut potongan berikutnya — BUKAN
    // galat, teruskan apa adanya supaya klien tahu harus lanjut.
    const teks = await hulu.text();
    return new NextResponse(teks, {
      status: hulu.status,
      headers: { "Content-Type": hulu.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    console.error("[kerja] relai unggah Drive gagal:", err);
    return NextResponse.json({ error: "Gagal meneruskan unggahan ke Drive." }, { status: 502 });
  }
}
