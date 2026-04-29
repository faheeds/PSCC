import { requireFinanceAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminExpenseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function FinanceReimbursementsPage() {
  await requireFinanceAdmin();

  async function updateStatus(formData: FormData) {
    "use server";
    await requireFinanceAdmin();
    const expenseId = String(formData.get("expenseId") || "");
    const status = String(formData.get("status") || "") as AdminExpenseStatus;
    if (!expenseId || !status) return;
    await prisma.adminExpense.update({
      where: { id: expenseId },
      data: { 
        status,
        reimbursedAt: status === "REIMBURSED" ? new Date() : undefined
      }
    });
    revalidatePath("/admin/finance/reimbursements");
    redirect("/admin/finance/reimbursements");
  }

  const [pending, reviewed, reimbursed] = await Promise.all([
    prisma.adminExpense.findMany({
      where: { status: "SUBMITTED" },
      include: { adminUser: { select: { name: true, email: true, zelleEmail: true, zellePhone: true } } },
      orderBy: { createdAt: "asc" }
    }),
    prisma.adminExpense.findMany({
      where: { status: "REVIEWED" },
      include: { adminUser: { select: { name: true, email: true, zelleEmail: true, zellePhone: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.adminExpense.findMany({
      where: { status: "REIMBURSED" },
      include: { adminUser: { select: { name: true } } },
      orderBy: { reimbursedAt: "desc" },
      take: 20
    })
  ]);

  const totalPending = pending.reduce((s, e) => s + e.amountCents, 0);
  const totalReviewed = reviewed.reduce((s, e) => s + e.amountCents, 0);

  const ExpenseCard = ({ expense, showActions }: { expense: typeof pending[0]; showActions: boolean }) => (
    <div className="bg-navy-700/30 border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-navy-100 text-sm font-semibold">{expense.title}</p>
          <p className="text-navy-400 text-xs mt-0.5">{expense.adminUser.name} · {formatDate(expense.expenseDate)}</p>
          {expense.notes && <p className="text-navy-400 text-xs mt-1">{expense.notes}</p>}
        </div>
        <p className="text-amber-300 text-lg font-bold flex-shrink-0">{formatCurrency(expense.amountCents)}</p>
      </div>

      {/* Payment details */}
      {(expense.adminUser.zelleEmail || expense.adminUser.zellePhone) && (
        <div className="bg-navy-800/60 rounded-lg px-3 py-2 text-xs">
          <span className="text-navy-500">Zelle: </span>
          <span className="text-navy-200">{expense.adminUser.zelleEmail || expense.adminUser.zellePhone}</span>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-1">
          <form action={updateStatus}>
            <input type="hidden" name="expenseId" value={expense.id} />
            <input type="hidden" name="status" value="REVIEWED" />
            <SubmitButton label="Mark reviewed" pendingLabel="..." className="rounded-lg bg-navy-600/50 border border-white/10 text-navy-200 text-xs px-3 py-1.5 hover:bg-navy-600 transition" />
          </form>
          <form action={updateStatus}>
            <input type="hidden" name="expenseId" value={expense.id} />
            <input type="hidden" name="status" value="REIMBURSED" />
            <SubmitButton label="✓ Mark reimbursed" pendingLabel="..." className="rounded-lg bg-forest-700/50 border border-forest-600/40 text-sage text-xs px-3 py-1.5 hover:bg-forest-700 transition" />
          </form>
        </div>
      )}
      {!showActions && expense.status === "REVIEWED" && (
        <form action={updateStatus}>
          <input type="hidden" name="expenseId" value={expense.id} />
          <input type="hidden" name="status" value="REIMBURSED" />
          <SubmitButton label="✓ Mark reimbursed" pendingLabel="..." className="rounded-lg bg-forest-700/50 border border-forest-600/40 text-sage text-xs px-3 py-1.5 hover:bg-forest-700 transition" />
        </form>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Finance · Expenses" title="Expense Approvals" description="Review and approve admin reimbursement requests." />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-amber-900/20 border border-amber-600/30 rounded-2xl p-4 text-center">
          <p className="text-amber-300 text-2xl font-bold">{formatCurrency(totalPending)}</p>
          <p className="text-amber-500 text-xs mt-1">{pending.length} pending requests</p>
        </div>
        <div className="bg-navy-800 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-navy-100 text-2xl font-bold">{formatCurrency(totalReviewed)}</p>
          <p className="text-navy-500 text-xs mt-1">{reviewed.length} reviewed, awaiting payment</p>
        </div>
        <div className="bg-forest-900/20 border border-forest-600/20 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
          <p className="text-sage text-2xl font-bold">{formatCurrency(reimbursed.reduce((s,e) => s+e.amountCents, 0))}</p>
          <p className="text-forest-500 text-xs mt-1">{reimbursed.length} reimbursed this season</p>
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl text-navy-100">Pending review</h2>
            <span className="bg-amber-900/30 text-amber-400 border border-amber-700/40 text-xs px-2 py-0.5 rounded-full">{pending.length}</span>
          </div>
          <div className="space-y-3">
            {pending.map(e => <ExpenseCard key={e.id} expense={e} showActions={true} />)}
          </div>
        </Card>
      )}

      {/* Reviewed - awaiting payment */}
      {reviewed.length > 0 && (
        <Card className="space-y-4">
          <h2 className="font-display text-xl text-navy-100">Reviewed — awaiting payment</h2>
          <div className="space-y-3">
            {reviewed.map(e => <ExpenseCard key={e.id} expense={e} showActions={false} />)}
          </div>
        </Card>
      )}

      {/* Reimbursed history */}
      {reimbursed.length > 0 && (
        <Card className="space-y-4">
          <h2 className="font-display text-xl text-navy-100">Recently reimbursed</h2>
          <div className="space-y-2">
            {reimbursed.map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-navy-300 text-sm truncate">{e.adminUser.name} — {e.title}</p>
                  <p className="text-navy-500 text-xs">{e.reimbursedAt ? formatDate(e.reimbursedAt) : ""}</p>
                </div>
                <p className="text-sage text-sm font-semibold">{formatCurrency(e.amountCents)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pending.length === 0 && reviewed.length === 0 && (
        <Card>
          <p className="text-navy-500 text-sm text-center py-4">No pending expense requests.</p>
        </Card>
      )}
    </div>
  );
}
