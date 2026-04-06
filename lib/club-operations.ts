import { prisma } from "@/lib/db";

export function dollarsToCents(value: FormDataEntryValue | null) {
  return Math.round(Number(value || 0) * 100);
}

export async function getAdminDirectory() {
  return prisma.adminUser.findMany({
    orderBy: [{ title: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      title: true
    }
  });
}

export async function getOperationsDashboardSummary() {
  const [
    activeMembers,
    outstandingBalance,
    collectedPayments,
    openReimbursements,
    activeGroundBookings,
    memberMediaSubmissions,
    lowStockEquipment,
  ] = await Promise.all([
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.ledgerEntry.aggregate({ _sum: { amountCents: true } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
    prisma.adminExpense.count({ where: { status: { in: ["SUBMITTED", "REVIEWED"] } } }),
    prisma.groundBooking.count({ where: { status: { in: ["REQUESTED", "CONFIRMED"] } } }),
    prisma.memberMediaSubmission.count({ where: { status: { in: ["SUBMITTED", "REVIEWED"] } } }),
    prisma.equipmentItem.count({ where: { quantityOnHand: { lte: 5 } } }),
  ]);

  return {
    activeMembers,
    outstandingBalanceCents: outstandingBalance._sum.amountCents ?? 0,
    collectedPaymentsCents: collectedPayments._sum.amountCents ?? 0,
    openReimbursements,
    activeGroundBookings,
    memberMediaSubmissions,
    lowStockEquipment,
  };
}
