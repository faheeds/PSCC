import { EquipmentCondition, EquipmentTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Card, SectionTitle, StatCard, fieldClassName } from "@/components/ui";
import { SubmitButton } from "@/components/forms/submit-button";
import { prisma } from "@/lib/db";
import { dollarsToCents, getAdminDirectory } from "@/lib/club-operations";
import { requireAdmin } from "@/lib/admin-auth";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EquipmentAdminPage() {
  async function createEquipmentItem(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.equipmentItem.create({
      data: {
        name: String(formData.get("name") || ""),
        category: String(formData.get("category") || ""),
        quantityOnHand: Number(formData.get("quantityOnHand") || 0),
        reorderLevel: Number(formData.get("reorderLevel") || 0),
        storageLocation: String(formData.get("storageLocation") || "") || null,
        condition: String(formData.get("condition") || "GOOD") as EquipmentCondition,
        preferredVendor: String(formData.get("preferredVendor") || "") || null,
        notes: String(formData.get("notes") || "") || null,
        lastPurchasedAt: formData.get("lastPurchasedAt") ? new Date(String(formData.get("lastPurchasedAt"))) : null,
        lastPurchaseCostCents: formData.get("lastPurchaseCost") ? dollarsToCents(formData.get("lastPurchaseCost")) : null
      }
    });

    revalidatePath("/admin/equipment");
    revalidatePath("/admin/dashboard");
  }

  async function createEquipmentLog(formData: FormData) {
    "use server";
    await requireAdmin();

    await prisma.equipmentTransaction.create({
      data: {
        equipmentItemId: String(formData.get("equipmentItemId") || ""),
        transactionType: String(formData.get("transactionType") || "PURCHASE") as EquipmentTransactionType,
        quantity: Number(formData.get("quantity") || 0),
        unitCostCents: formData.get("unitCost") ? dollarsToCents(formData.get("unitCost")) : null,
        reference: String(formData.get("reference") || "") || null,
        notes: String(formData.get("notes") || "") || null,
        performedByAdminId: String(formData.get("performedByAdminId") || "") || null,
        occurredAt: formData.get("occurredAt") ? new Date(String(formData.get("occurredAt"))) : new Date()
      }
    });

    revalidatePath("/admin/equipment");
    revalidatePath("/admin/dashboard");
  }

  const [admins, items, logs, lowStockCount] = await Promise.all([
    getAdminDirectory(),
    prisma.equipmentItem.findMany({
      include: {
        transactions: {
          orderBy: { occurredAt: "desc" },
          take: 3
        }
      },
      orderBy: [{ category: "asc" }, { name: "asc" }]
    }),
    prisma.equipmentTransaction.findMany({
      include: {
        equipmentItem: true,
        performedBy: true
      },
      orderBy: { occurredAt: "desc" },
      take: 20
    }),
    prisma.equipmentItem.count({ where: { quantityOnHand: { lte: 5 } } })
  ]);

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Equipment"
        title="Inventory, purchase tracking, and issue logs"
        description="Give practice coordinators and equipment managers a clear view of what is on hand, what needs to be purchased, and what has been damaged or issued."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Inventory items" value={String(items.length)} />
        <StatCard label="Low stock items" value={String(lowStockCount)} tone="warning" />
        <StatCard label="Recent equipment logs" value={String(logs.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Add equipment item</h2>
          <form action={createEquipmentItem} className="grid gap-4 md:grid-cols-2">
            <input name="name" placeholder="Item name" required className={fieldClassName} />
            <input name="category" placeholder="Category" required className={fieldClassName} />
            <input name="quantityOnHand" type="number" min="0" step="1" placeholder="Quantity on hand" required className={fieldClassName} />
            <input name="reorderLevel" type="number" min="0" step="1" placeholder="Reorder level" required className={fieldClassName} />
            <input name="storageLocation" placeholder="Storage location" className={fieldClassName} />
            <select name="condition" defaultValue="GOOD" className={fieldClassName}>
              <option value="NEW">New</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="NEEDS_REPAIR">Needs repair</option>
              <option value="RETIRED">Retired</option>
            </select>
            <input name="preferredVendor" placeholder="Preferred vendor" className={fieldClassName} />
            <input name="lastPurchasedAt" type="date" className={fieldClassName} />
            <input name="lastPurchaseCost" type="number" min="0" step="0.01" placeholder="Last purchase cost" className={fieldClassName} />
            <textarea name="notes" placeholder="Notes" className={`${fieldClassName} md:col-span-2 min-h-24`} />
            <SubmitButton label="Save item" pendingLabel="Saving..." className="md:col-span-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60" />
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Log equipment movement</h2>
          <form action={createEquipmentLog} className="grid gap-4">
            <select name="equipmentItemId" required defaultValue="" className={fieldClassName}>
              <option value="" disabled>
                Select item
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} | {item.quantityOnHand} on hand
                </option>
              ))}
            </select>
            <select name="transactionType" defaultValue="PURCHASE" className={fieldClassName}>
              <option value="PURCHASE">Purchase</option>
              <option value="ISSUE">Issue</option>
              <option value="RETURN">Return</option>
              <option value="DAMAGE">Damage</option>
              <option value="LOSS">Loss</option>
              <option value="REPAIR">Repair</option>
              <option value="STOCK_ADJUSTMENT">Stock adjustment</option>
            </select>
            <input name="quantity" type="number" step="1" placeholder="Quantity" required className={fieldClassName} />
            <input name="unitCost" type="number" min="0" step="0.01" placeholder="Unit cost if applicable" className={fieldClassName} />
            <select name="performedByAdminId" defaultValue="" className={fieldClassName}>
              <option value="">Performed by</option>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.name}
                </option>
              ))}
            </select>
            <input name="occurredAt" type="datetime-local" className={fieldClassName} />
            <input name="reference" placeholder="Vendor, player, or reference" className={fieldClassName} />
            <textarea name="notes" placeholder="Notes" className={`${fieldClassName} min-h-24`} />
            <SubmitButton label="Log transaction" pendingLabel="Saving..." />
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Inventory</h2>
          <div className="space-y-3">
            {items.length ? (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="text-sm text-slate-500">
                        {item.category} | {item.storageLocation ?? "Storage not set"}
                      </p>
                    </div>
                    <div className="text-sm text-slate-700">
                      <p>{item.quantityOnHand} on hand</p>
                      <p>Reorder at {item.reorderLevel}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    Condition: {item.condition.replaceAll("_", " ")}
                    {item.preferredVendor ? ` | Vendor: ${item.preferredVendor}` : ""}
                    {item.lastPurchaseCostCents ? ` | Last purchase: ${formatCurrency(item.lastPurchaseCostCents)}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No equipment items have been added yet.</p>
            )}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-display text-2xl text-ink">Recent equipment activity</h2>
          <div className="space-y-3">
            {logs.length ? (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-slate-100 p-4">
                  <p className="font-semibold text-ink">{log.equipmentItem.name}</p>
                  <p className="text-sm text-slate-500">
                    {log.transactionType.replaceAll("_", " ")} | {formatDateTime(log.occurredAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Quantity: {log.quantity}
                    {log.unitCostCents ? ` | Unit cost: ${formatCurrency(log.unitCostCents)}` : ""}
                    {log.performedBy?.name ? ` | By: ${log.performedBy.name}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No equipment activity has been logged yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
