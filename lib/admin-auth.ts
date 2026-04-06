import { redirect } from "next/navigation";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || !isAllowedAdminEmail(session.user.email) || session.user.role !== "ADMIN" || !session.user.adminUserId) {
    redirect("/admin/login");
  }

  return session;
}
