import { LedgerCategory, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export function computeBalanceCents(entries: Array<{ amountCents: number }>) {
  return entries.reduce((total, entry) => total + entry.amountCents, 0);
}

export function getBalanceTone(balanceCents: number) {
  if (balanceCents > 0) return "due";
  if (balanceCents < 0) return "credit";
  return "settled";
}

export function getGameTypeBucket(gameTypeName: string) {
  const normalized = gameTypeName.trim().toUpperCase();

  if (normalized.includes("T20")) {
    return "T20";
  }

  if (normalized.includes("T40") || normalized.includes("LEAGUE")) {
    return "T40";
  }

  return "OTHER";
}

export function summarizePayments(entries: Array<{ amountCents: number }>) {
  return Math.abs(entries.filter((entry) => entry.amountCents < 0).reduce((sum, entry) => sum + entry.amountCents, 0));
}

export function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export async function importMemberDuesCsv(csvContent: string) {
  const rows = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) {
    throw new Error("Upload a CSV with a header row and at least one data row.");
  }

  const headers = parseCsvLine(rows[0]).map((header) => header.trim().toLowerCase());
  const emailIndex = headers.findIndex((header) => header === "email" || header === "memberemail" || header === "member_email");
  const descriptionIndex = headers.findIndex((header) => header === "description");
  const amountIndex = headers.findIndex((header) => header === "amount" || header === "amountusd" || header === "amount_usd");
  const categoryIndex = headers.findIndex((header) => header === "category");
  const occurredAtIndex = headers.findIndex((header) => header === "occurredat" || header === "occurred_at" || header === "date");

  if (emailIndex === -1 || descriptionIndex === -1 || amountIndex === -1) {
    throw new Error("CSV must include email, description, and amount columns.");
  }

  const importedEntries: Array<{
    memberId: string;
    category: LedgerCategory;
    description: string;
    amountCents: number;
    occurredAt: Date;
  }> = [];

  for (const row of rows.slice(1)) {
    const cells = parseCsvLine(row);
    const email = (cells[emailIndex] ?? "").toLowerCase();
    const description = cells[descriptionIndex] ?? "";
    const amountValue = Number(cells[amountIndex] ?? "");
    const categoryValue = (cells[categoryIndex] ?? "CLUB_FEE").toUpperCase();
    const occurredAtRaw = cells[occurredAtIndex] ?? "";

    if (!email || !description || Number.isNaN(amountValue)) {
      throw new Error(`Invalid CSV row: ${row}`);
    }

    const member = await prisma.member.findUnique({
      where: { email }
    });

    if (!member) {
      throw new Error(`No member found for email ${email}.`);
    }

    const category = Object.values(LedgerCategory).includes(categoryValue as LedgerCategory)
      ? (categoryValue as LedgerCategory)
      : LedgerCategory.CLUB_FEE;

    let amountCents = Math.round(amountValue * 100);
    if (category === LedgerCategory.CREDIT || category === LedgerCategory.PAYMENT) {
      amountCents = -Math.abs(amountCents);
    } else {
      amountCents = Math.abs(amountCents);
    }

    const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error(`Invalid occurredAt/date value for ${email}.`);
    }

    importedEntries.push({
      memberId: member.id,
      category,
      description,
      amountCents,
      occurredAt
    });
  }

  await prisma.ledgerEntry.createMany({
    data: importedEntries
  });

  return importedEntries.length;
}

export async function getMemberBalance(memberId: string) {
  const result = await prisma.ledgerEntry.aggregate({
    where: { memberId },
    _sum: { amountCents: true }
  });

  return result._sum.amountCents ?? 0;
}

export async function createManualCharge(args: {
  memberId: string;
  category: LedgerCategory;
  description: string;
  amountCents: number;
}) {
  return prisma.ledgerEntry.create({
    data: {
      memberId: args.memberId,
      category: args.category,
      description: args.description,
      amountCents: args.amountCents
    }
  });
}

export async function createBulkCharge(args: {
  category: LedgerCategory;
  description: string;
  amountCents: number;
}) {
  const members = await prisma.member.findMany({
    where: { status: "ACTIVE" },
    select: { id: true }
  });

  if (!members.length) {
    return 0;
  }

  await prisma.ledgerEntry.createMany({
    data: members.map((member) => ({
      memberId: member.id,
      category: args.category,
      description: args.description,
      amountCents: args.amountCents
    }))
  });

  return members.length;
}

export async function recordGameParticipation(memberId: string, gameId: string) {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: gameId },
      include: { gameType: true }
    });

    if (!game) {
      throw new Error("Game not found.");
    }

    const existing = await tx.gameParticipation.findUnique({
      where: {
        memberId_gameId: {
          memberId,
          gameId
        }
      }
    });

    if (existing) {
      throw new Error("That player has already been recorded for this game.");
    }

    const participation = await tx.gameParticipation.create({
      data: {
        memberId,
        gameId,
        feeCents: game.gameType.feeCents
      }
    });

    await tx.ledgerEntry.create({
      data: {
        memberId,
        category: LedgerCategory.GAME_FEE,
        description: `${game.title} player fee`,
        amountCents: game.gameType.feeCents,
        occurredAt: game.gameDate,
        gameParticipationId: participation.id
      }
    });

    return participation;
  });
}

export async function markPaymentPaidByCheckoutSession(
  checkoutSessionId: string,
  paymentIntentId: string,
  amountCents: number | null
) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { checkoutSessionId },
      include: { ledgerEntry: true }
    });

    if (!payment) {
      throw new Error("Payment session not found.");
    }

    if (payment.status === PaymentStatus.PAID && payment.ledgerEntry) {
      return payment;
    }

    const paidAt = new Date();
    const settledAmount = amountCents ?? payment.amountCents;

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        paymentIntentId: paymentIntentId || payment.paymentIntentId,
        paidAt
      }
    });

    if (!payment.ledgerEntry) {
      await tx.ledgerEntry.create({
        data: {
          memberId: payment.memberId,
          category: LedgerCategory.PAYMENT,
          description: "Online member payment",
          amountCents: -Math.abs(settledAmount),
          occurredAt: paidAt,
          paymentId: payment.id
        }
      });
    }

    return updatedPayment;
  });
}
