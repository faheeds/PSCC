import Link from "next/link";
import { getOperationsDashboardSummary } from "@/lib/club-operations";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const summary = await getOperationsDashboardSummary();

  const stats = [
    {
      label: "Active members",
      value: String(summary.activeMembers),
      sub: "registered players",
      href: "/admin/members",
      accent: "forest",
    },
    {
      label: "Outstanding balance",
      value: formatCurrency(summary.outstandingBalanceCents),
      sub: "across all members",
      href: "/admin/ledger",
      accent: "amber",
    },
    {
      label: "Collected online",
      value: formatCurrency(summary.collectedPaymentsCents),
      sub: "via Stripe this season",
      href: "/admin/ledger",
      accent: "forest",
    },
    {
      label: "Open reimbursements",
      value: String(summary.openReimbursements),
      sub: "awaiting approval",
      href: "/admin/reimbursements",
      accent: summary.openReimbursements > 0 ? "amber" : "slate",
    },
    {
      label: "Ground bookings",
      value: String(summary.activeGroundBookings),
      sub: "active this week",
      href: "/admin/grounds",
      accent: "navy",
    },
    {
      label: "Media submissions",
      value: String(summary.memberMediaSubmissions),
      sub: "pending review",
      href: "/admin/social",
      accent: summary.memberMediaSubmissions > 0 ? "amber" : "slate",
    },
    {
      label: "Equipment needed",
      value: String(summary.lowStockEquipment),
      sub: "items low in stock",
      href: "/admin/equipment",
      accent: summary.lowStockEquipment > 0 ? "red" : "slate",
    },
  ];

  const quickLinks = [
    { href: "/admin/practices", label: "Add practice", icon: "＋", desc: "Schedule next session" },
    { href: "/admin/games", label: "Add game", icon: "＋", desc: "Record a match result" },
    { href: "/admin/members", label: "Add member", icon: "＋", desc: "Create member account" },
    { href: "/admin/communications", label: "Send comms", icon: "✉", desc: "Email all members" },
  ];

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-forest-400 text-xs font-semibold uppercase tracking-widest mb-1">Admin Operations</p>
          <h1 className="text-navy-100 text-2xl font-semibold">Club at a glance</h1>
          <p className="text-navy-400 text-sm mt-1">Key numbers and quick actions for today.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-navy-400 text-xs">North Robinswood Cricket Field</p>
          <p className="text-navy-300 text-xs mt-0.5">Next practice: Wednesday</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`
              group relative bg-navy-800 border rounded-2xl p-4 no-underline hover:bg-navy-700 transition-all duration-200 hover:-translate-y-0.5
              ${stat.accent === "forest" ? "border-forest-600/30" :
                stat.accent === "amber"  ? "border-amber-600/30" :
                stat.accent === "red"    ? "border-red-600/30" :
                stat.accent === "navy"   ? "border-navy-600/50" :
                "border-white/5"}
            `}
          >
            {/* Accent dot */}
            <div className={`
              w-1.5 h-1.5 rounded-full mb-3
              ${stat.accent === "forest" ? "bg-sage" :
                stat.accent === "amber"  ? "bg-amber-400" :
                stat.accent === "red"    ? "bg-red-400" :
                stat.accent === "navy"   ? "bg-navy-300" :
                "bg-navy-600"}
            `}/>
            <p className={`
              text-2xl font-bold mb-1
              ${stat.accent === "forest" ? "text-mint" :
                stat.accent === "amber"  ? "text-amber-300" :
                stat.accent === "red"    ? "text-red-400" :
                "text-navy-100"}
            `}>
              {stat.value}
            </p>
            <p className="text-navy-300 text-xs font-medium">{stat.label}</p>
            <p className="text-navy-500 text-[10px] mt-0.5">{stat.sub}</p>
            <span className="absolute top-4 right-4 text-navy-600 text-xs group-hover:text-navy-400 transition">→</span>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] text-navy-500 uppercase tracking-widest font-medium mb-3">Quick actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-navy-800 border border-white/5 rounded-2xl p-4 no-underline hover:bg-navy-700 hover:border-forest-600/30 transition-all group"
            >
              <span className="text-forest-400 text-lg group-hover:text-sage transition">{link.icon}</span>
              <p className="text-navy-100 text-sm font-medium mt-2">{link.label}</p>
              <p className="text-navy-500 text-xs mt-0.5">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Status strip */}
      <div className="bg-navy-800 border border-white/5 rounded-2xl p-5">
        <p className="text-[10px] text-navy-500 uppercase tracking-widest font-medium mb-4">Season overview</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-navy-400 text-xs mb-1">Practice ground</p>
            <p className="text-navy-100 text-sm font-medium">North Robinswood</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs mb-1">Practice day</p>
            <p className="text-navy-100 text-sm font-medium">Every Wednesday</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs mb-1">Formats</p>
            <p className="text-navy-100 text-sm font-medium">T20 & T40</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs mb-1">Portal</p>
            <Link href="/" className="text-sage text-sm font-medium no-underline hover:text-mint transition">View member site →</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
