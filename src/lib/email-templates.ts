import "server-only";
import {
  PROJECT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUS_ORDER,
  type WorkNote,
  type WorkProject,
  type WorkSchedule,
  type WorkTask,
} from "@/lib/workspace-types";
import { formatTanggalLokal, formatWaktuLokal, sekarangWIB } from "@/lib/workspace-utils";

/**
 * Templat email ringkasan proyek — HTML dengan gaya inline & tata letak
 * tabel, format paling aman supaya tampilannya tidak berantakan di berbagai
 * aplikasi email (Gmail, Outlook, dst). Jangan pakai CSS eksternal/variabel —
 * kebanyakan klien email tidak membacanya.
 */

const WARNA_PRIORITAS: Record<string, string> = {
  tinggi: "#ef4444",
  sedang: "#f59e0b",
  rendah: "#a1a1aa",
};

function esc(teks: string): string {
  return teks
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function bagian(judul: string, isi: string): string {
  return `
    <tr>
      <td style="padding:28px 32px 0 32px;">
        <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#71717a;">${esc(judul)}</p>
        ${isi}
      </td>
    </tr>`;
}

function daftarTugas(tugas: WorkTask[]): string {
  if (tugas.length === 0) {
    return `<p style="margin:0;font-size:14px;color:#a1a1aa;">Belum ada tugas.</p>`;
  }

  const kolom = TASK_STATUS_ORDER.map((status) => {
    const items = tugas.filter((t) => t.status === status).sort((a, b) => a.urutan - b.urutan);
    if (items.length === 0) return "";

    const baris = items
      .map(
        (t) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">
          <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${WARNA_PRIORITAS[t.prioritas] ?? "#a1a1aa"};margin-right:8px;"></span>
          ${esc(t.judul)}
          ${t.tenggat ? `<span style="font-size:12px;color:#a1a1aa;margin-left:6px;">— ${formatWaktuLokal(t.tenggat)}</span>` : ""}
        </td>
      </tr>`,
      )
      .join("");

    return `
      <tr>
        <td style="padding:14px 0 4px 0;font-size:12px;font-weight:700;color:#52525b;">
          ${esc(TASK_STATUS_LABEL[status])} <span style="color:#a1a1aa;font-weight:400;">(${items.length})</span>
        </td>
      </tr>
      ${baris}`;
  }).join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${kolom}</table>`;
}

function daftarCatatan(catatan: WorkNote[]): string {
  if (catatan.length === 0) {
    return `<p style="margin:0;font-size:14px;color:#a1a1aa;">Belum ada catatan.</p>`;
  }
  const baris = catatan
    .map(
      (c) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">${esc(c.judul)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${baris}</table>`;
}

function daftarJadwal(jadwal: WorkSchedule[]): string {
  if (jadwal.length === 0) {
    return `<p style="margin:0;font-size:14px;color:#a1a1aa;">Tidak ada jadwal terkait.</p>`;
  }
  const baris = jadwal
    .sort((a, b) => a.mulai.localeCompare(b.mulai))
    .map(
      (j) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;">
          ${esc(j.judul)}
          <span style="font-size:12px;color:#a1a1aa;margin-left:6px;">— ${formatWaktuLokal(j.mulai)}</span>
        </td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${baris}</table>`;
}

export function templateRingkasanProyek(input: {
  proyek: WorkProject;
  tugas: WorkTask[];
  catatan: WorkNote[];
  jadwal: WorkSchedule[];
  urlProyek: string;
}): string {
  const { proyek, tugas, catatan, jadwal, urlProyek } = input;
  const selesai = tugas.filter((t) => t.status === "done").length;
  const total = tugas.length;
  const persen = total > 0 ? Math.round((selesai / total) * 100) : 0;

  return `<!doctype html>
<html lang="id">
  <body style="margin:0;padding:24px 12px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <p style="margin:0 0 6px 0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#a1a1aa;">Ringkasan proyek</p>
                <h1 style="margin:0;font-size:22px;color:#18181b;">${esc(proyek.judul)}</h1>
                <p style="margin:10px 0 0 0;font-size:13px;color:#71717a;">
                  Status: <strong style="color:#18181b;">${esc(PROJECT_STATUS_LABEL[proyek.status])}</strong>
                  &nbsp;·&nbsp; ${selesai}/${total} tugas selesai (${persen}%)
                </p>
                ${proyek.deskripsi ? `<p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;color:#3f3f46;">${esc(proyek.deskripsi)}</p>` : ""}
              </td>
            </tr>

            ${bagian("Papan tugas", daftarTugas(tugas))}
            ${bagian("Catatan & materi", daftarCatatan(catatan))}
            ${bagian("Jadwal terkait", daftarJadwal(jadwal))}

            <tr>
              <td style="padding:28px 32px 32px 32px;">
                <a href="${urlProyek}" style="display:inline-block;padding:10px 18px;background:#18181b;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">
                  Buka proyek ini
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f4f4f5;">
                <p style="margin:0;font-size:11px;color:#a1a1aa;">Dikirim otomatis dari Ultraproduktif — ${formatTanggalLokal(sekarangWIB())}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
