import type { Metadata } from "next";
import { ProyekForm } from "@/components/kerja/proyek-form";

export const metadata: Metadata = { title: "Proyek baru" };

export default function ProyekBaruPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-lg">Proyek baru</h1>
      <ProyekForm />
    </div>
  );
}
