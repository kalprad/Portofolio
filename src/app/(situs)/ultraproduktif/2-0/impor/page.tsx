import type { Metadata } from "next";
import Link from "next/link";
import { ImporForm } from "@/components/kerja/impor-form";

export const metadata: Metadata = { title: "Impor · Ultraproduktif 2.0" };

// Impor menulis puluhan baris ke Sheets berturut-turut.
export const maxDuration = 60;

export default function ImporPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/ultraproduktif/2-0" className="link-underline text-sm text-muted-foreground">
          ← Ultraproduktif 2.0
        </Link>
        <h1 className="display-lg mt-3">Impor data</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Data pribadi sengaja tidak disimpan di repositori (publik). Berkas JSON ditempel di sini dan langsung ditulis ke Google Sheets Ultraproduktif.
        </p>
      </div>
      <ImporForm />
    </div>
  );
}
