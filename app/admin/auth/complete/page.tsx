import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminGoogleCompletePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/admin/login?error=GoogleAdminSessionFailed");
  }

  if (session.user.role === "ADMIN" && session.user.adminUserId) {
    redirect("/admin/dashboard");
  }

  redirect("/admin/login?error=GoogleAdminNotAllowlisted");
}
