import "server-only";
import nodemailer from "nodemailer";

/**
 * Pengiriman email lewat SMTP Gmail akun pribadi — bukan layanan pihak
 * ketiga baru. Cukup satu "App Password" (butuh 2-Step Verification aktif di
 * akun Google-nya), gratis, dan batas kirimnya (500/hari) jauh melebihi
 * kebutuhan mengirim ringkasan proyek sesekali.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASSWORD);
}

let transporter: nodemailer.Transporter | null = null;

function client(): nodemailer.Transporter {
  if (transporter) return transporter;

  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASSWORD;
  if (!user || !pass) {
    throw new Error("EMAIL_SMTP_USER dan EMAIL_SMTP_PASSWORD belum disetel.");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export async function kirimEmail(opsi: { ke: string; subjek: string; html: string }): Promise<void> {
  const user = process.env.EMAIL_SMTP_USER;
  await client().sendMail({
    from: `"Ultraproduktif" <${user}>`,
    to: opsi.ke,
    subject: opsi.subjek,
    html: opsi.html,
  });
}
