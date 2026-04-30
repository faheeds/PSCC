import { auth } from "@/lib/auth";
import { MemberHeader } from "@/components/member-header";
import { NotificationBell } from "@/components/notification-bell";
import { BottomNav } from "@/components/site-header";
import { prisma } from "@/lib/db";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  let memberName: string | undefined;
  if (session?.user?.memberId) {
    const member = await prisma.member.findUnique({
      where: { id: session.user.memberId },
      select: { name: true },
    });
    memberName = member?.name ?? undefined;
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <MemberHeader memberName={memberName} notificationBell={<NotificationBell />} />
      <div className="pb-24">
        {children}
      </div>
      <BottomNav active="account" />
    </div>
  );
}
