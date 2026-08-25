import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sesiAman } from "@/lib/auth";
import { getArchiveItemById, logArchiveAccess } from "@/lib/queries";
import {
  driveMode,
  fetchDriveContent,
  publicDriveUrl,
  driveFolderUrl,
} from "@/lib/drive";

/**
 * Satu-satunya jalan menuju berkas arsip.
 *
 * Urutannya: periksa sesi → periksa hak akses butir → catat jejak → baru
 * salurkan berkas. Pencatatan terjadi untuk hasil apa pun, termasuk penolakan,
 * supaya panel admin menampilkan gambaran yang jujur soal siapa mencoba apa.
 *
 * Rute ini tidak boleh di-cache: hasilnya bergantung pada sesi pemanggil.
 */

export const dynamic = "force-dynamic";

/** IP disimpan sebagai hash, bukan nilai mentah — cukup untuk mengenali pola. */
function hashIp(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  if (!raw) return null;

  const salt = process.env.LOG_IP_SALT ?? "";
  return createHash("sha256").update(`${raw}${salt}`).digest("hex").slice(0, 32);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const session = await sesiAman();
  const ipHash = hashIp(request);

  const jejakDasar = {
    itemId,
    userEmail: session?.user?.email ?? null,
    userName: session?.user?.name ?? null,
    userRole: session?.user?.role ?? null,
    ipHash,
  };

  const butir = await getArchiveItemById(itemId);

  if (!butir || !butir.is_published || !butir.collection?.is_published) {
    await logArchiveAccess({
      ...jejakDasar,
      collectionSlug: butir?.collection?.slug ?? null,
      itemTitle: butir?.title_id ?? null,
      outcome: "gagal",
    });
    return NextResponse.json({ error: "Berkas tidak ditemukan." }, { status: 404 });
  }

  const jejak = {
    ...jejakDasar,
    collectionSlug: butir.collection.slug,
    itemTitle: butir.title_id,
  };

  const perluUgm = butir.access_level === "ugm";
  if (perluUgm && !session?.user?.isUgm) {
    await logArchiveAccess({ ...jejak, outcome: "ditolak" });

    // Kembalikan pengunjung ke halaman mata kuliahnya, di mana gerbang UGM
    // sudah menjelaskan apa yang harus dilakukan — jangan buang mereka ke
    // halaman galat buntu.
    const tujuan = new URL(`/arsip/${butir.collection.slug}`, request.nextUrl.origin);
    tujuan.searchParams.set("perlu", "ugm");
    return NextResponse.redirect(tujuan, { status: 303 });
  }

  await logArchiveAccess({ ...jejak, outcome: "ok" });

  // Butir berupa tautan luar atau folder Drive: tidak ada byte untuk disalurkan.
  if (!butir.drive_file_id) {
    const target = butir.external_url
      ? butir.external_url
      : butir.drive_folder_id
        ? driveFolderUrl(butir.drive_folder_id)
        : null;

    if (!target) {
      return NextResponse.json(
        { error: "Butir ini belum punya sumber berkas." },
        { status: 409 },
      );
    }
    // `target` boleh berupa path relatif (mis. berkas statis di /public), jadi
    // selalu dibangun jadi URL absolut — NextResponse.redirect menolak string
    // relatif tanpa base dan bakal melempar galat 500.
    return NextResponse.redirect(new URL(target, request.nextUrl.origin), { status: 302 });
  }

  // Mode alih: tanpa service account, server hanya bisa mengarahkan.
  if (driveMode() === "alih") {
    return NextResponse.redirect(publicDriveUrl(butir.drive_file_id), { status: 302 });
  }

  // Mode proxy: server mengambil isinya, URL Drive tidak pernah keluar.
  try {
    const hulu = await fetchDriveContent(butir.drive_file_id);

    if (!hulu.ok || !hulu.body) {
      await logArchiveAccess({ ...jejak, outcome: "gagal" });
      return NextResponse.json(
        { error: "Gagal mengambil berkas dari Drive." },
        { status: 502 },
      );
    }

    const namaBerkas = namaAman(butir.title_id, butir.mime_type);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      hulu.headers.get("content-type") ?? butir.mime_type ?? "application/octet-stream",
    );
    const panjang = hulu.headers.get("content-length");
    if (panjang) headers.set("Content-Length", panjang);
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(namaBerkas)}`,
    );
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(hulu.body, { status: 200, headers });
  } catch (err) {
    console.error("[unduh] gagal menyalurkan berkas:", err);
    await logArchiveAccess({ ...jejak, outcome: "gagal" });
    return NextResponse.json({ error: "Terjadi kesalahan di server." }, { status: 500 });
  }
}

const EKSTENSI: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
};

function namaAman(judul: string, mime: string | null): string {
  const dasar =
    judul
      .normalize("NFKD")
      .replace(/[^\w\s.-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "berkas";
  const ext = mime ? EKSTENSI[mime] : undefined;
  return ext && !dasar.toLowerCase().endsWith(`.${ext}`) ? `${dasar}.${ext}` : dasar;
}
