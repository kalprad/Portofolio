import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

/**
 * Penulisan konten kembali ke repositori.
 *
 * Dua mode, dipilih otomatis:
 *
 * LOKAL — saat `npm run dev`. Perubahan langsung ditulis ke berkas di disk,
 *   jadi hasilnya terlihat seketika. Commit dilakukan sendiri lewat git seperti
 *   biasa.
 *
 * GITHUB — di produksi. Setiap simpan menjadi satu commit lewat GitHub
 *   Contents API, dan Vercel mendeteksinya lalu deploy ulang. Perubahan baru
 *   tampil di situs setelah deploy selesai (sekitar satu menit) — panel admin
 *   memberi tahu hal ini setelah menyimpan.
 *
 * Setel `CONTENT_WRITE_MODE` untuk memaksa salah satunya (berguna kalau ingin
 * menguji alur commit dari komputer sendiri).
 */

export type WriteMode = "lokal" | "github";

const API = "https://api.github.com";

export function githubConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO,
  );
}

export function contentWriteMode(): WriteMode {
  const paksa = process.env.CONTENT_WRITE_MODE;
  if (paksa === "lokal" || paksa === "github") return paksa;

  // Di produksi berkas aplikasi bersifat read-only, jadi satu-satunya jalan
  // menyimpan adalah lewat GitHub.
  if (process.env.NODE_ENV === "production") return "github";
  return "lokal";
}

export function githubBranch(): string {
  return process.env.GITHUB_BRANCH ?? "main";
}

function repoUrl(relatif: string): string {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  return `${API}/repos/${owner}/${repo}/contents/${relatif
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** SHA berkas yang sekarang ada di repo — wajib disertakan saat menimpa. */
async function shaSaatIni(relatif: string): Promise<string | null> {
  const url = new URL(repoUrl(relatif));
  url.searchParams.set("ref", githubBranch());

  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub menolak permintaan (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { sha?: string };
  return data.sha ?? null;
}

async function tulisGithub(relatif: string, isi: string | Buffer, pesan: string): Promise<void> {
  if (!githubConfigured()) {
    throw new Error(
      "GitHub belum dikonfigurasi. Isi GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO.",
    );
  }

  const sha = await shaSaatIni(relatif);
  const isiBase64 = Buffer.isBuffer(isi) ? isi.toString("base64") : Buffer.from(isi, "utf-8").toString("base64");

  const res = await fetch(repoUrl(relatif), {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify({
      message: pesan,
      content: isiBase64,
      branch: githubBranch(),
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    // 409 berarti berkas berubah di antara pembacaan SHA dan penulisan — biasanya
    // dua tab admin terbuka bersamaan.
    if (res.status === 409) {
      throw new Error(
        "Berkas ini baru saja berubah di repositori. Muat ulang halaman lalu simpan lagi.",
      );
    }
    throw new Error(`Gagal menyimpan ke GitHub (${res.status}): ${detail}`);
  }
}

async function hapusGithub(relatif: string, pesan: string): Promise<void> {
  const sha = await shaSaatIni(relatif);
  if (!sha) return;

  const res = await fetch(repoUrl(relatif), {
    method: "DELETE",
    headers: headers(),
    body: JSON.stringify({ message: pesan, sha, branch: githubBranch() }),
  });

  if (!res.ok) {
    throw new Error(`Gagal menghapus di GitHub (${res.status}): ${await res.text()}`);
  }
}

async function tulisLokal(relatif: string, isi: string | Buffer): Promise<void> {
  const absolut = path.join(process.cwd(), relatif);
  await fs.mkdir(path.dirname(absolut), { recursive: true });
  if (Buffer.isBuffer(isi)) {
    await fs.writeFile(absolut, isi);
  } else {
    await fs.writeFile(absolut, isi, "utf-8");
  }
}

async function hapusLokal(relatif: string): Promise<void> {
  try {
    await fs.unlink(path.join(process.cwd(), relatif));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

// --- API yang dipakai server action -------------------------------------------

export async function simpanBerkas(
  relatif: string,
  isi: string | Buffer,
  pesan: string,
): Promise<void> {
  if (contentWriteMode() === "github") {
    await tulisGithub(relatif, isi, pesan);
  } else {
    await tulisLokal(relatif, isi);
  }
}

export async function hapusBerkas(relatif: string, pesan: string): Promise<void> {
  if (contentWriteMode() === "github") {
    await hapusGithub(relatif, pesan);
  } else {
    await hapusLokal(relatif);
  }
}

// --- Serialisasi --------------------------------------------------------------

/** Buang kunci bernilai kosong supaya frontmatter tetap ringkas dan enak dibaca. */
function bersihkan(meta: Record<string, unknown>): Record<string, unknown> {
  const hasil: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    hasil[k] = v;
  }
  return hasil;
}

export function keMarkdown(meta: Record<string, unknown>, body: string): string {
  return matter.stringify(`\n${body.trim()}\n`, bersihkan(meta));
}

export function keJson(obj: unknown): string {
  return `${JSON.stringify(obj, null, 2)}\n`;
}
