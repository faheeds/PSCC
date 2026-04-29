import Link from "next/link";
import { ClubLogo } from "@/components/club-logo";
import { requireAdmin } from "@/lib/admin-auth";

const navItems = [
  { href: "/admin/dashboard",      label: "Dashboard" },
  { href: "/admin/members",        label: "Members" },
  { href: "/admin/practices",      label: "Practices" },
  { href: "/admin/games",          label: "Games" },
  { href: "/admin/scorecards",     label: "Scorecards" },
  { href: "/admin/grounds",        label: "Grounds" },
  { href: "/admin/ledger",         label: "Ledger" },
  { href: "/admin/equipment",      label: "Equipment" },
  { href: "/admin/social",         label: "Social Media" },
  { href: "/admin/communications", label: "Comms" },
  { href: "/admin/tasks",          label: "Tasks" },
  { href: "/admin/reimbursements", label: "Reimbursements" },
];

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-navy-900 flex">

      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 bg-navy-800 border-r border-white/5 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="relative w-8 h-8 flex-shrink-0">
            <ClubLogo className="w-8 h-8" priority />
          </div>
          <div>
            <p className="text-navy-100 text-sm font-semibold leading-tight">PSCC Admin</p>
            <p className="text-navy-400 text-[10px]">Operations Portal</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-navy-300 text-sm no-underline hover:bg-white/5 hover:text-navy-100 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/5 space-y-2">
          <Link href="/leaderboard" className="block text-sage text-xs no-underline hover:text-mint transition">
            🏏 Leaderboard
          </Link>
          <Link href="/" className="block text-navy-500 text-xs no-underline hover:text-navy-300 transition">
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* ── Mobile top nav ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-navy-800 border-b border-white/5">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative w-7 h-7"><ClubLogo className="w-7 h-7" priority /></div>
          <span className="text-navy-100 text-sm font-semibold flex-1">PSCC Admin</span>
          <Link href="/" className="text-navy-400 text-xs no-underline">← Site</Link>
        </div>
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-shrink-0 bg-navy-700/60 border border-white/5 text-navy-300 text-xs px-3 py-1.5 rounded-full no-underline hover:text-navy-100 transition whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0">
        <div className="pt-24 lg:pt-0">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
