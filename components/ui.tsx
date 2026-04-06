import Link from "next/link";
import { cn } from "@/lib/utils";

export const fieldClassName =
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
    <div className={cn("rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-soft backdrop-blur sm:p-6", className)} {...props}>
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
    <div className="space-y-2">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{eyebrow}</p> : null}
      <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p> : null}
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
      ? "bg-brand-50 text-brand-900"
      : tone === "warning"
        ? "bg-amber-50 text-amber-900"
        : "bg-slate-50 text-ink";

  const cardContent = (
    <Card className={cn("space-y-2 border-0", href ? "transition hover:-translate-y-0.5 hover:shadow-lg" : "", toneClassName)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        {href ? <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">View</span> : null}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block text-inherit no-underline">
        {cardContent}
      </Link>
    );
  }

  return (
    cardContent
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-brand-800", className)}>
      {children}
    </span>
  );
}
