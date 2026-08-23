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
  await signIn("google", {
    redirectTo: typeof tujuan === "string" && tujuan.startsWith("/") ? tujuan : "/",
  });
}

export async function keluar() {
  await signOut({ redirectTo: "/" });
}
