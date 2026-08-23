"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/primitives";

/** Mencetak halaman CV. Gaya cetaknya diatur blok @media print di globals.css. */
export function PrintButton({ label = "Cetak / simpan PDF" }: { label?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
