import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { saveAdminExpenseInvoice, getAdminReimbursementSummary } from "@/lib/admin-expenses";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminReimbursementsPage() {
  const session = await requireAdmin();
  const adminUserId = session.user?.adminUserId;

  async function updateProfile(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    const adminUserId = session.user?.adminUserId;

    await prisma.adminUser.update({
      where: { id: adminUserId },
      data: {
        name: String(formData.get("name") || ""),
        title: String(formData.get("title") || "") || null,
        phone: String(formData.get("phone") || "") || null,
        zelleEmail: String(formData.get("zelleEmail") || "") || null,
        zellePhone: String(formData.get("zellePhone") || "") || null
      }
    });

    revalidatePath("/admin/reimbursements");
    revalidatePath("/admin/dashboard");
  }

  async function submitExpense(formData: FormData) {
    "use server";
    const session = await requireAdmin();
    const adminUserId = session.user?.adminUserId;
    const invoiceFile = formData.get("invoice");
    const storedInvoice =
      invoiceFile && typeof invoiceFile === "object" && "arrayBuffer" in invoiceFile
        ? await saveAdminExpenseInvoice(invoiceFile as File)
        : null;

    await prisma.adminExpense.create({
      data: {
        adminUserId: String(adminUserId),
        title: String(formData.get("title") || ""),
        notes: String(formData.get("notes") || "") || null,
        amountCents: Math.round(Number(formData.get("amount")) * 100),
        expenseDate: new Date(String(formData.get("expenseDate") || "")),
        reimbursementEmail: String(formData.get("reimbursementEmail") || "") || null,
        reimbursementPhone: String(formData.get("reimbursementPhone") || "") || null,
        invoicePath: storedInvoice?.invoicePath ?? null,
        invoiceFileName: storedInvoice?.invoiceFileName ?? null
      }
    });

    revalidatePath("/admin/reimbursements");
    revalidatePath("/admin/dashboard");
  }

  const [admin, summary] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: adminUserId }
    }),
    getAdminReimbursementSummary()
  ]);

  if (!admin) {
    return null;
  }

  const myExpenses = summary.expenses.filter((expense) => expense.adminUserId === admin.id);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Reimbursements"
        title="Admin expenses and reimbursement details"
        description="Each admin can keep a simple profile, upload invoices, and submit reimbursement requests with a Zelle email or phone number."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Submitted expenses" value={formatCurrency(summary.submittedCents)} />
        <StatCard label="Pending reimbursement" value={formatCurrency(summary.pendingCents)} tone="warning" />
        <StatCard label="Marked reimbursed" value={formatCurrency(summary.reimbursedCents)} tone="success" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">My admin profile</h2>
          <form action={updateProfile} className="grid gap-4">
            <input name="name" defaultValue={admin.name} placeholder="Full name" required className={fieldClassName} />
            <input name="title" defaultValue={admin.title ?? ""} placeholder="Role or department" className={fieldClassName} />
            <input name="phone" defaultValue={admin.phone ?? ""} placeholder="Phone number" className={fieldClassName} />
            <input name="zelleEmail" defaultValue={admin.zelleEmail ?? ""} placeholder="Zelle email" className={fieldClassName} />
            <input name="zellePhone" defaultValue={admin.zellePhone ?? ""} placeholder="Zelle phone" className={fieldClassName} />
            <SubmitButton label="Save admin profile" pendingLabel="Saving..." />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Submit expense for reimbursement</h2>
          <form action={submitExpense} className="grid gap-4">
            <input name="title" placeholder="Expense title" required className={fieldClassName} />
            <input name="amount" type="number" step="0.01" min="0.01" placeholder="Amount in dollars" required className={fieldClassName} />
            <input name="expenseDate" type="date" required className={fieldClassName} />
            <input
              name="reimbursementEmail"
              type="email"
              defaultValue={admin.zelleEmail ?? admin.email}
              placeholder="Zelle email"
              className={fieldClassName}
            />
            <input
              name="reimbursementPhone"
              defaultValue={admin.zellePhone ?? admin.phone ?? ""}
              placeholder="Zelle phone"
              className={fieldClassName}
            />
            <input name="invoice" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className={fieldClassName} />
            <textarea name="notes" rows={4} placeholder="Expense notes" className={fieldClassName} />
            <SubmitButton label="Submit reimbursement request" pendingLabel="Submitting..." />
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">My submitted expenses</h2>
          <div className="space-y-3">
            {myExpenses.length ? (
              myExpenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{expense.title}</p>
                      <p className="text-sm text-slate-500">
                        {formatDate(expense.expenseDate)} | Submitted {formatDateTime(expense.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-brand-700">{formatCurrency(expense.amountCents)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">Status: {expense.status}</p>
                  <p className="text-sm text-slate-700">
                    Zelle: {expense.reimbursementEmail || "—"} {expense.reimbursementPhone ? `| ${expense.reimbursementPhone}` : ""}
                  </p>
                  {expense.invoicePath ? (
                    <Link href={expense.invoicePath} target="_blank" className="mt-3 inline-flex text-sm font-semibold text-brand-700 no-underline">
                      Open invoice
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">You have not submitted any reimbursement requests yet.</p>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">All admin reimbursement requests</h2>
          <div className="space-y-3">
            {summary.expenses.length ? (
              summary.expenses.map((expense) => (
                <div key={expense.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{expense.title}</p>
                      <p className="text-sm text-slate-500">
                        {expense.adminUser.name} | {expense.adminUser.title ?? "Admin"} | {formatDate(expense.expenseDate)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-brand-700">{formatCurrency(expense.amountCents)}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    Reimburse via Zelle: {expense.reimbursementEmail || expense.reimbursementPhone || "Not provided"}
                  </p>
                  <p className="text-sm text-slate-700">Status: {expense.status}</p>
                  {expense.invoicePath ? (
                    <Link href={expense.invoicePath} target="_blank" className="mt-3 inline-flex text-sm font-semibold text-brand-700 no-underline">
                      View invoice
                    </Link>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No reimbursement requests have been submitted yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
