import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendPushToAllMembers } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  await requireAdmin();

  const { title, body, data } = await req.json();
  if (!title || !body) {
    return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
  }

  const result = await sendPushToAllMembers(title, body, data);
  return NextResponse.json(result);
}
