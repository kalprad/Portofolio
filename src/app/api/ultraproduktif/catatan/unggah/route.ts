import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * Relai unggah lampiran Catatan — peramban PUT isi berkasnya ke SINI (sesama
 * domain), lalu di sini kita teruskan ke sesi resumable upload Drive.
 *
 * Kenapa tidak PUT langsung dari peramban ke Drive: sempat dicoba begitu,
 * tapi Google Drive tidak mengizinkan CORS untuk PUT resumable upload dari
 * origin sembarang — peramban memblokirnya sebelum permintaan terkirim sama
 * sekali (muncul sebagai galat jaringan generik, padahal bukan soal koneksi).
 * Server-ke-server tidak kena aturan CORS (itu aturan khusus peramban), jadi
 * relai satu langkah ini menyelesaikannya.
 *
 * Jalan di Edge runtime dan meneruskan body sebagai STREAM (bukan dibaca
 * penuh ke memori dulu) — itu caranya lolos dari batas ukuran request fungsi
 * serverless Vercel (~4,5 MB) yang membatasi upload lain di situs ini.
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

  if (!request.body) {
    return NextResponse.json({ error: "Tidak ada isi berkas." }, { status: 400 });
  }

  // "Content-Length" tidak bisa disetel manual lewat fetch() (nama header
  // terlarang di spesifikasinya — undici melempar galat, beda dari peramban
  // yang diam-diam membuangnya) padahal kita PUT satu-satunya & terakhir
  // "potongan" berkasnya sekaligus (bukan resumable bertahap sungguhan).
  // "Content-Range" adalah cara resmi Drive buat bilang "ini potongan
  // terakhir, totalnya segini" tanpa header itu.
  const headers: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") ?? "application/octet-stream",
  };
  const total = Number(request.headers.get("content-length"));
  if (Number.isFinite(total) && total > 0) {
    headers["Content-Range"] = `bytes 0-${total - 1}/${total}`;
  }

  try {
    const hulu = await fetch(sesiUrl, {
      method: "PUT",
      headers,
      body: request.body,
      duplex: "half",
    } as RequestInit);

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
