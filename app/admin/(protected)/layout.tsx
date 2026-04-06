import Link from "next/link";
import { PageShell } from "@/components/ui";
import { requireAdmin } from "@/lib/admin-auth";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/grounds", label: "Grounds" },
  { href: "/admin/practices", label: "Practices" },
  { href: "/admin/equipment", label: "Equipment" },
  { href: "/admin/communications", label: "Communications" },
  { href: "/admin/social", label: "Social Media" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/games", label: "Games" },
  { href: "/admin/ledger", label: "Ledger" },
  { href: "/admin/reimbursements", label: "Reimbursements" }
];

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="min-h-screen">
      <PageShell className="space-y-8">
        <div className="flex flex-wrap gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink no-underline"
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </PageShell>
    </main>
  );
}
