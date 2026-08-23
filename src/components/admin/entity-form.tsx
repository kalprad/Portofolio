"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, Check, ChevronDown, Loader2, Save } from "lucide-react";
import {
  Button,
  ButtonLink,
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/primitives";
import { simpanEntitas } from "@/app/admin/actions";
import { fieldGroups, type FieldDef, type ResourceDef } from "@/lib/admin-schema";
import { FORM_STATE_AWAL } from "@/lib/form-state";
import { cn } from "@/lib/utils";

type Nilai = Record<string, unknown>;

function nilaiAwal(field: FieldDef, data: Nilai): string {
  const v = data[field.name];
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (field.type === "datetime" && typeof v === "string") {
    // <input type="datetime-local"> hanya menerima "YYYY-MM-DDTHH:mm".
    return v.slice(0, 16);
  }
  if (field.type === "date" && typeof v === "string") return v.slice(0, 10);
  return String(v);
}

function KolomIsian({
  field,
  data,
  error,
  opsiDinamis,
}: {
  field: FieldDef;
  data: Nilai;
  error?: string;
  opsiDinamis?: { value: string; label: string }[];
}) {
  const id = `f-${field.name}`;
  const awal = nilaiAwal(field, data);
  const opsi = opsiDinamis ?? field.options ?? [];

  if (field.type === "checkbox") {
    return (
      <div className={field.full ? "sm:col-span-2" : undefined}>
        <Checkbox
          id={id}
          name={field.name}
          label={field.label}
          defaultChecked={data[field.name] === true}
        />
        {field.hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{field.hint}</p>
        ) : null}
      </div>
    );
  }

  return (
    <Field
      label={field.label}
      htmlFor={id}
      hint={field.hint}
      error={error}
      required={field.required}
      className={field.full ? "sm:col-span-2" : undefined}
    >
      {field.type === "select" ? (
        <Select id={id} name={field.name} defaultValue={awal} required={field.required}>
          <option value="">— pilih —</option>
          {opsi.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : field.type === "markdown" ? (
        <Textarea
          id={id}
          name={field.name}
          defaultValue={awal}
          placeholder={field.placeholder}
          rows={16}
          spellCheck
        />
      ) : field.type === "textarea" ? (
        <Textarea
          id={id}
          name={field.name}
          defaultValue={awal}
          placeholder={field.placeholder}
          rows={3}
          className="font-sans"
          spellCheck
        />
      ) : (
        <Input
          id={id}
          name={field.name}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "datetime" ? "datetime-local" : "text"}
          inputMode={field.type === "number" ? "numeric" : undefined}
          defaultValue={awal}
          placeholder={field.placeholder}
          aria-describedby={error ? `${id}-error` : field.hint ? `${id}-hint` : undefined}
          aria-invalid={error ? true : undefined}
        />
      )}
    </Field>
  );
}

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Menyimpan…
        </>
      ) : (
        <>
          <Save className="size-4" aria-hidden />
          Simpan
        </>
      )}
    </Button>
  );
}

export function EntityForm({
  resource,
  data = {},
  id = null,
  opsiDinamis = {},
  batalKe,
}: {
  resource: ResourceDef;
  data?: Nilai;
  id?: string | null;
  opsiDinamis?: Record<string, { value: string; label: string }[]>;
  batalKe?: string;
}) {
  const aksi = simpanEntitas.bind(null, resource.key, id);
  const [state, formAction] = useActionState(aksi, FORM_STATE_AWAL);

  const grup = fieldGroups(resource);
  // Terjemahan disembunyikan dulu: fase 1 hanya Bahasa Indonesia, dan
  // menampilkan semuanya sekaligus hanya membuat formulir terasa berat.
  const [terjemahanTerbuka, setTerjemahanTerbuka] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-10">
      {state.message ? (
        <p
          role="status"
          className={cn(
            "flex items-start gap-2.5 rounded border px-4 py-3 text-sm",
            state.ok
              ? "border-success/40 bg-muted text-success"
              : "border-destructive/40 bg-muted text-destructive",
          )}
        >
          {state.ok ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          {state.message}
        </p>
      ) : null}

      {grup.map((g) => {
        const isTerjemahan = g.name === "Terjemahan";

        if (isTerjemahan) {
          return (
            <section key={g.name} className="rounded border border-dashed border-border">
              <button
                type="button"
                onClick={() => setTerjemahanTerbuka((v) => !v)}
                aria-expanded={terjemahanTerbuka}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span>
                  <span className="font-display font-semibold">Terjemahan Inggris</span>
                  <span className="ml-2 text-xs text-subtle">
                    opsional — dipakai saat versi EN dinyalakan
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 transition-transform duration-200",
                    terjemahanTerbuka && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>

              {/* Kolomnya tetap dirender walau tertutup, supaya nilainya ikut
                  terkirim dan tidak terhapus tanpa sengaja saat menyimpan. */}
              <div
                className={cn(
                  "grid gap-5 border-t border-border px-5 py-6 sm:grid-cols-2",
                  !terjemahanTerbuka && "hidden",
                )}
              >
                {g.fields.map((f) => (
                  <KolomIsian
                    key={f.name}
                    field={f}
                    data={data}
                    error={state.errors?.[f.name]}
                    opsiDinamis={opsiDinamis[f.name]}
                  />
                ))}
              </div>
            </section>
          );
        }

        return (
          <section key={g.name}>
            <h2 className="eyebrow">{g.name}</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {g.fields.map((f) => (
                <KolomIsian
                  key={f.name}
                  field={f}
                  data={data}
                  error={state.errors?.[f.name]}
                  opsiDinamis={opsiDinamis[f.name]}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 px-1 py-4 backdrop-blur-sm">
        <TombolSimpan />
        {batalKe ? (
          <ButtonLink href={batalKe} variant="ghost">
            Batal
          </ButtonLink>
        ) : null}
        {state.ok ? (
          <Link href={resource.basePath} className="link-underline text-sm text-muted-foreground">
            Kembali ke daftar {resource.plural.toLowerCase()}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
