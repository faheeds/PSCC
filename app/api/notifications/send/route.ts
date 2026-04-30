import { NextRequest, NextResponse } from "next/server";
import { sendPushToAllMembers } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, body, data } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
  }

  const result = await sendPushToAllMembers(title, body, data);
  return NextResponse.json(result);
}
