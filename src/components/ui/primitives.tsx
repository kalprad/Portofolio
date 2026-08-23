import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

/* ==========================================================================
   Tombol
   Semua ukuran menjaga tinggi sentuh minimal 44px di layar kecil.
   ========================================================================== */

type Variant = "primary" | "outline" | "ghost" | "accent" | "destructive";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:opacity-90 border border-transparent",
  accent:
    "bg-accent text-on-accent hover:opacity-90 border border-transparent",
  outline:
    "bg-transparent text-foreground border border-border-strong hover:bg-muted",
  ghost:
    "bg-transparent text-muted-foreground border border-transparent hover:bg-muted hover:text-foreground",
  destructive:
    "bg-destructive text-on-destructive hover:opacity-90 border border-transparent",
};

const SIZE: Record<Size, string> = {
  sm: "min-h-[38px] px-3 text-sm gap-1.5",
  md: "min-h-[44px] px-4 text-sm gap-2",
  lg: "min-h-[52px] px-6 text-base gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center rounded font-medium cursor-pointer",
    "transition-[background-color,color,opacity,border-color] duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    extra,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ==========================================================================
   Penanda / label kecil
   ========================================================================== */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    accent: "bg-accent-soft text-accent",
    success: "bg-muted text-success",
    warning: "bg-muted text-warning",
    danger: "bg-muted text-destructive",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ==========================================================================
   Wadah & tata letak
   ========================================================================== */

export function Container({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "narrow" | "default" | "wide";
}) {
  const widths = {
    narrow: "max-w-2xl",
    default: "max-w-5xl",
    wide: "max-w-7xl",
  } as const;
  return (
    <div className={cn("mx-auto w-full px-5 sm:px-8", widths[size], className)}>
      {children}
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="mt-2 text-3xl sm:text-4xl">{title}</h2>
        {description ? (
          <p className="mt-3 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ==========================================================================
   Keadaan kosong
   ========================================================================== */

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-dashed border-border-strong px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}

/* ==========================================================================
   Kolom isian
   Label selalu terlihat — tidak pernah hanya mengandalkan placeholder.
   ========================================================================== */

const CONTROL =
  "w-full rounded border border-border-strong bg-surface px-3 py-2.5 text-sm " +
  "text-foreground placeholder:text-subtle transition-colors duration-200 " +
  "focus:border-accent disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {children}
      {/* Pesan galat menempel di kolomnya, bukan menumpuk di atas formulir. */}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "min-h-32 resize-y font-mono", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        className={cn("size-4 cursor-pointer accent-[var(--accent)]", className)}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
