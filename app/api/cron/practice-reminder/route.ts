import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPushToAllMembers } from "@/lib/firebase-admin";

// Runs every Tuesday at 7 PM Pacific (Wednesday 3 AM UTC)
// and every Wednesday at 3:45 PM Pacific (Wednesday 11:45 PM UTC)
export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed
  const hour = now.getUTCHours();

  // Find next Wednesday practice
  const nextWednesday = new Date(now);
  const daysUntilWed = (3 - now.getDay() + 7) % 7 || 7;
  nextWednesday.setDate(now.getDate() + daysUntilWed);
  nextWednesday.setHours(0, 0, 0, 0);
  const nextWedEnd = new Date(nextWednesday);
  nextWedEnd.setDate(nextWedEnd.getDate() + 1);

  const practice = await prisma.practiceSession.findFirst({
    where: {
      startsAt: { gte: nextWednesday, lt: nextWedEnd },
      status: "PLANNED",
    },
  });

  if (!practice) {
    return NextResponse.json({ message: "No practice found" });
  }

  // Tuesday 7 PM Pacific = Wednesday 3:00 UTC (hour 2-3)
  if (dayOfWeek === 2 && hour >= 2 && hour < 4) {
    const result = await sendPushToAllMembers(
      "🏏 Practice Tomorrow!",
      `PSCC Wednesday session at ${practice.location}. Check-in opens at 4:00 PM — see you on the pitch!`,
      { link: "https://pscc-mu.vercel.app/account", type: "practice_reminder" }
    );
    return NextResponse.json({ message: "Tuesday reminder sent", ...result });
  }

  // Wednesday 3:45 PM Pacific = Wednesday 23:45 UTC
  if (dayOfWeek === 3 && hour === 23) {
    const result = await sendPushToAllMembers(
      "⏰ Check-in Opens in 15 Minutes!",
      `PSCC Practice check-in opens at 4:00 PM. Head to ${practice.location}!`,
      { link: "https://pscc-mu.vercel.app/account", type: "checkin_reminder" }
    );
    return NextResponse.json({ message: "Check-in reminder sent", ...result });
  }

  return NextResponse.json({ message: "Not a reminder time", dayOfWeek, hour });
}
