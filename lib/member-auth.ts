import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireMember() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "MEMBER" || !session.user.memberId) {
    redirect("/account/sign-in");
  }

  return session;
}

export async function assertMemberApiRequest() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "MEMBER" || !session.user.memberId) {
    throw new Error("Unauthorized");
  }

  return session;
}
