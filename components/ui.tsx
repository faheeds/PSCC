import Link from "next/link";
import { cn } from "@/lib/utils";

export const fieldClassName =
  "w-full rounded-xl border border-white/10 bg-navy-700/50 px-4 py-3 text-sm text-navy-100 shadow-sm outline-none ring-0 placeholder:text-navy-500 focus:border-forest-500 focus:ring-forest-500";

export const fieldClassNameLight =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-brand-400 focus:ring-brand-400";

export function PageShell({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10", className)} {...props}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-white/5 bg-navy-800 p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1.5">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-widest text-forest-400">{eyebrow}</p> : null}
      <h1 className="font-display text-2xl tracking-tight text-navy-100 sm:text-3xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm leading-6 text-navy-400">{description}</p> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
  href
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
  href?: string;
}) {
  const toneClassName =
    tone === "success"
      ? "border-forest-600/30 bg-forest-900/20"
      : tone === "warning"
        ? "border-amber-600/30 bg-amber-900/20"
        : "border-white/5 bg-navy-800";

  const valueClassName =
    tone === "success"
      ? "text-mint"
      : tone === "warning"
        ? "text-amber-300"
        : "text-navy-100";

  const cardContent = (
    <div className={cn("rounded-2xl border p-5 space-y-2", href ? "transition hover:-translate-y-0.5 hover:bg-navy-700/50" : "", toneClassName)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-navy-400 uppercase tracking-wider">{label}</p>
          <p className={cn("text-3xl font-bold tracking-tight", valueClassName)}>{value}</p>
        </div>
        {href ? <span className="text-[10px] font-semibold uppercase tracking-widest text-navy-500 group-hover:text-navy-300 transition">View →</span> : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group no-underline block">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
}

export function Badge({
  children,
  tone = "default"
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "error";
}) {
  const toneClassName =
    tone === "success"
      ? "bg-forest-700/30 text-sage border-forest-600/40"
      : tone === "warning"
        ? "bg-amber-900/30 text-amber-400 border-amber-700/40"
        : tone === "error"
          ? "bg-red-900/30 text-red-400 border-red-700/40"
          : "bg-navy-700/40 text-navy-300 border-navy-600/40";

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", toneClassName)}>
      {children}
    </span>
  );
}
