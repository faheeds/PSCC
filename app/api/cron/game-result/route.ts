import { NextRequest, NextResponse } from "next/server";
import { sendPushToAllMembers } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  // Called internally when admin saves a game result
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { opponent, result, psccScore, opponentScore } = await req.json();

  const emoji = result === "Won" ? "🏆" : result === "Lost" ? "😤" : "🤝";
  const title = `${emoji} PSCC vs ${opponent} — ${result}!`;
  const body = psccScore && opponentScore
    ? `PSCC ${psccScore} vs ${opponent} ${opponentScore}`
    : `Match result recorded. Check the app for full scorecard.`;

  const notifResult = await sendPushToAllMembers(title, body, {
    link: "https://pscc-mu.vercel.app/leaderboard",
    type: "game_result"
  });

  return NextResponse.json(notifResult);
}
