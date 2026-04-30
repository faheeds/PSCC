import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token, platform = "web" } = await req.json();
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  // Upsert the token
  await prisma.notificationToken.upsert({
    where: { token },
    create: { token, platform, memberId: session.user.memberId },
    update: { memberId: session.user.memberId, platform },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await req.json();
  if (token) {
    await prisma.notificationToken.deleteMany({
      where: { token, memberId: session.user.memberId },
    });
  }

  return NextResponse.json({ ok: true });
}
