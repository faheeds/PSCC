import { requireFinanceAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, SectionTitle, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LedgerCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DuesManagementPage() {
  await requireFinanceAdmin();

  async function chargeMember(formData: FormData) {
    "use server";
    await requireFinanceAdmin();
    const memberId = String(formData.get("memberId") || "");
    const amountCents = Math.round(Number(formData.get("amount")) * 100);
    const description = String(formData.get("description") || "");
    const category = String(formData.get("category") || "CLUB_FEE") as LedgerCategory;
    if (!memberId || !amountCents || !description) return;
    await prisma.ledgerEntry.create({
      data: { memberId, category, description, amountCents, occurredAt: new Date() }
    });
    revalidatePath("/admin/finance/dues");
    redirect("/admin/finance/dues?saved=1");
  }

  async function chargeAllMembers(formData: FormData) {
    "use server";
    await requireFinanceAdmin();
    const amountCents = Math.round(Number(formData.get("amount")) * 100);
    const description = String(formData.get("description") || "");
    const category = String(formData.get("category") || "CLUB_FEE") as LedgerCategory;
    if (!amountCents || !description) return;
    const members = await prisma.member.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
    await prisma.ledgerEntry.createMany({
      data: members.map(m => ({ memberId: m.id, category, description, amountCents, occurredAt: new Date() }))
    });
    revalidatePath("/admin/finance/dues");
    redirect("/admin/finance/dues?saved=1");
  }

  async function updateEntry(formData: FormData) {
    "use server";
    await requireFinanceAdmin();
    const entryId = String(formData.get("entryId") || "");
    const amountCents = Math.round(Number(formData.get("amount")) * 100);
    const description = String(formData.get("description") || "");
    if (!entryId) return;
    await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: { amountCents, description }
    });
    revalidatePath("/admin/finance/dues");
    redirect("/admin/finance/dues?saved=1");
  }

  const [members, recentEntries] = await Promise.all([
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" }
    }),
    prisma.ledgerEntry.findMany({
      include: { member: { select: { name: true } } },
      orderBy: { occurredAt: "desc" },
      take: 30
    })
  ]);

  const memberBalances = await prisma.ledgerEntry.groupBy({
    by: ["memberId"],
    _sum: { amountCents: true }
  });

  const balanceMap = Object.fromEntries(memberBalances.map(b => [b.memberId, b._sum.amountCents ?? 0]));

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Finance · Dues" title="Dues Management" description="Add charges to individual members or all active members at once." />

      {/* Charge individual member */}
      <Card className="space-y-4">
        <h2 className="font-display text-xl text-navy-100">Charge a member</h2>
        <form action={chargeMember} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select name="memberId" className={fieldClassName} required>
            <option value="">Select member...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select name="category" defaultValue="CLUB_FEE" className={fieldClassName}>
            <option value="CLUB_FEE">Club fee</option>
            <option value="GAME_FEE">Game fee</option>
            <option value="UNIFORM">Uniform</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <input name="description" placeholder="Description" className={fieldClassName} required />
          <input name="amount" type="number" step="0.01" placeholder="Amount ($)" className={fieldClassName} required />
          <div className="sm:col-span-2 lg:col-span-4">
            <SubmitButton label="Add charge" pendingLabel="Adding..." />
          </div>
        </form>
      </Card>

      {/* Charge all members */}
      <Card className="space-y-4 border-amber-600/20">
        <h2 className="font-display text-xl text-navy-100">Charge all active members</h2>
        <p className="text-navy-400 text-sm">Posts the same charge to every active member simultaneously.</p>
        <form action={chargeAllMembers} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <select name="category" defaultValue="CLUB_FEE" className={fieldClassName}>
            <option value="CLUB_FEE">Club fee</option>
            <option value="GAME_FEE">Game fee</option>
            <option value="UNIFORM">Uniform</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <input name="description" placeholder="Description (e.g. Annual dues 2026)" className={fieldClassName} required />
          <input name="amount" type="number" step="0.01" placeholder="Amount per member ($)" className={fieldClassName} required />
          <SubmitButton label="Charge all members" pendingLabel="Posting..." className="w-full rounded-xl bg-amber-700/30 border border-amber-600/40 text-amber-300 px-4 py-3 text-sm font-medium hover:bg-amber-700/50 transition" />
        </form>
      </Card>

      {/* Member balances */}
      <Card className="space-y-4">
        <h2 className="font-display text-xl text-navy-100">Member balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-navy-400 font-medium pb-3">Member</th>
                <th className="text-right text-navy-400 font-medium pb-3">Balance</th>
                <th className="text-right text-navy-400 font-medium pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map(m => {
                const balance = balanceMap[m.id] ?? 0;
                return (
                  <tr key={m.id}>
                    <td className="py-3 text-navy-200">{m.name}</td>
                    <td className={`py-3 text-right font-semibold ${balance > 0 ? "text-amber-400" : balance < 0 ? "text-sage" : "text-navy-400"}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="py-3 text-right">
                      <a href={`/admin/members?highlight=${m.id}`} className="text-xs text-sage no-underline hover:text-mint transition">View →</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent entries */}
      <Card className="space-y-4">
        <h2 className="font-display text-xl text-navy-100">Recent entries</h2>
        <div className="space-y-2">
          {recentEntries.map(entry => (
            <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-navy-200 text-sm font-medium truncate">{entry.member.name}</p>
                <p className="text-navy-500 text-xs">{entry.description} · {formatDate(entry.occurredAt)}</p>
              </div>
              <span className={`text-sm font-semibold flex-shrink-0 ${entry.amountCents > 0 ? "text-amber-400" : "text-sage"}`}>
                {entry.amountCents > 0 ? "+" : ""}{formatCurrency(entry.amountCents)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
