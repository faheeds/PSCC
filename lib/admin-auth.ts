import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || !isAllowedAdminEmail(session.user.email) || session.user.role !== "ADMIN" || !session.user.adminUserId) {
    redirect("/admin/login");
  }
  return session;
}

// Finance-only gate: redirects to dashboard if admin is not a finance admin
export async function requireFinanceAdmin() {
  const session = await requireAdmin();
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.user?.adminUserId },
    select: { isFinance: true },
  });
  if (!adminUser?.isFinance) {
    redirect("/admin/dashboard?error=finance_access_denied");
  }
  return session;
}

export async function getIsFinanceAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.adminUserId) return false;
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: session.user.adminUserId },
    select: { isFinance: true },
  });
  return adminUser?.isFinance ?? false;
}
