import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "admin-expenses");

export async function saveAdminExpenseInvoice(file: File) {
  if (!file.size) {
    return null;
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Invoice file must be 5MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = path.extname(file.name || "") || ".bin";
  const storedFileName = `${randomUUID()}${extension}`;

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, storedFileName), buffer);

  return {
    invoicePath: `/uploads/admin-expenses/${storedFileName}`,
    invoiceFileName: file.name || storedFileName
  };
}

export async function getAdminReimbursementSummary() {
  const expenses = await prisma.adminExpense.findMany({
    include: {
      adminUser: true
    },
    orderBy: [{ createdAt: "desc" }]
  });

  const totals = expenses.reduce(
    (summary, expense) => {
      summary.submitted += expense.amountCents;
      if (expense.status === "REIMBURSED") {
        summary.reimbursed += expense.amountCents;
      }
      return summary;
    },
    { submitted: 0, reimbursed: 0 }
  );

  return {
    expenses,
    submittedCents: totals.submitted,
    reimbursedCents: totals.reimbursed,
    pendingCents: totals.submitted - totals.reimbursed
  };
}
