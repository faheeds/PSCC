import { SectionTitle, StatCard } from "@/components/ui";
import { getOperationsDashboardSummary } from "@/lib/club-operations";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const summary = await getOperationsDashboardSummary();

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Admin Operations"
        title="Club management at a glance"
        description="A simpler dashboard with only the key numbers the club needs every day."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard label="Active members" value={String(summary.activeMembers)} href="/admin/members" />
        <StatCard label="Outstanding balance" value={formatCurrency(summary.outstandingBalanceCents)} tone="warning" />
        <StatCard label="Collected online" value={formatCurrency(summary.collectedPaymentsCents)} tone="success" />
        <StatCard label="Open reimbursements" value={String(summary.openReimbursements)} href="/admin/reimbursements" />
        <StatCard label="Active ground bookings" value={String(summary.activeGroundBookings)} href="/admin/grounds" />
        <StatCard label="Member media" value={String(summary.memberMediaSubmissions)} href="/admin/social" />
        <StatCard label="Equipment needed" value={String(summary.lowStockEquipment)} tone="warning" href="/admin/equipment" />
      </div>
    </div>
  );
}
