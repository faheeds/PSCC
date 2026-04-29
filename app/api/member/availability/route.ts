import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gameId, status, notes } = await req.json();
  if (!gameId || !status) {
    return NextResponse.json({ error: "Missing gameId or status" }, { status: 400 });
  }

  const availability = await prisma.gameAvailability.upsert({
    where: { gameId_memberId: { gameId, memberId: session.user.memberId } },
    create: { gameId, memberId: session.user.memberId, status, notes },
    update: { status, notes },
  });

  return NextResponse.json(availability);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await prisma.gameAvailability.findMany({
    where: { memberId: session.user.memberId },
    include: {
      game: { select: { id: true, title: true, gameDate: true, opponent: true, venue: true, status: true } },
    },
    orderBy: { game: { gameDate: "asc" } },
  });

  return NextResponse.json(availability);
}
