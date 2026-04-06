import { LedgerCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { createBulkCharge } from "@/lib/ledger";
import { requireAdmin } from "@/lib/admin-auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLedgerPage() {
  async function postBulkCharge(formData: FormData) {
    "use server";
    await requireAdmin();

    await createBulkCharge({
      category: String(formData.get("category") || "CLUB_FEE") as LedgerCategory,
      description: String(formData.get("description") || ""),
      amountCents: Math.round(Number(formData.get("amount")) * 100)
    });

    revalidatePath("/admin/ledger");
    revalidatePath("/admin/members");
    revalidatePath("/admin/dashboard");
  }

  const entries = await prisma.ledgerEntry.findMany({
    include: { member: true },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: 50
  });

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Ledger"
        title="Post club-wide charges and review recent account activity"
        description="Use bulk charges for annual club fees, kits, or other assessments across all active members."
      />

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Charge all active members</h2>
        <form action={postBulkCharge} className="grid gap-4 md:grid-cols-[0.8fr_1.2fr_0.7fr_auto]">
          <select name="category" defaultValue="CLUB_FEE" className={fieldClassName}>
            <option value="CLUB_FEE">Club fee</option>
            <option value="UNIFORM">Uniform</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
          <input name="description" placeholder="Description shown on each member ledger" required className={fieldClassName} />
          <input name="amount" type="number" min="0.01" step="0.01" placeholder="Amount" required className={fieldClassName} />
          <SubmitButton label="Post to all" pendingLabel="Posting..." />
        </form>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Recent ledger entries</h2>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{entry.member.name}</p>
                <p className="text-sm text-slate-500">
                  {entry.description} | {entry.category.replaceAll("_", " ")} | {formatDateTime(entry.occurredAt)}
                </p>
              </div>
              <p className={`text-sm font-semibold ${entry.amountCents > 0 ? "text-amber-700" : "text-brand-700"}`}>
                {entry.amountCents > 0 ? "+" : "-"}
                {formatCurrency(Math.abs(entry.amountCents))}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
