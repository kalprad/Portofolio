"use server";

import { signIn, signOut } from "@/lib/auth";

/**
 * Aksi masuk/keluar.
 *
 * Dibuat sebagai server action supaya tombolnya tetap berfungsi tanpa
 * JavaScript di sisi klien — cukup <form action={...}>.
 */

export async function masukDenganGoogle(formData: FormData) {
  const tujuan = formData.get("tujuan");
  const tujuanAman = typeof tujuan === "string" && tujuan.startsWith("/") ? tujuan : "/";

  // Scope Drive (drive.file) cuma diminta kalau tujuan login-nya area
  // admin/Ultraproduktif — lihat catatan di provider Google pada auth.ts
  // buat alasannya. Pengunjung yang cuma mau buka arsip UGM tidak pernah
  // melihat layar izin Drive sama sekali.
  const butuhDrive = tujuanAman.startsWith("/admin") || tujuanAman.startsWith("/ultraproduktif");

  await signIn(
    "google",
    { redirectTo: tujuanAman },
    butuhDrive
      ? {
          prompt: "consent select_account",
          access_type: "offline",
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
        }
      : undefined,
  );
}

export async function keluar() {
  await signOut({ redirectTo: "/" });
}
