import type { Metadata } from "next";
import { EntityForm } from "@/components/admin/entity-form";
import { getResource } from "@/lib/admin-schema";
import { getProfileRow } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Profil" };

export default async function SuntingProfil() {
  const resource = getResource("profil");
  const data = await getProfileRow();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="display-lg">Profil</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Identitas yang tampil di beranda, halaman Tentang, kepala CV, dan kaki
          situs. Hanya ada satu profil — menyimpan akan memperbarui yang ini.
        </p>
      </div>

      <EntityForm
        resource={resource}
        data={data ?? {}}
        id={data ? String(data.id) : null}
      />
    </div>
  );
}
