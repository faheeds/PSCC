import { prisma } from "@/lib/db";

export async function reassignImportedGameFeeRule(gameId: string, gameTypeId: string) {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({
      where: { id: gameId },
      include: {
        participations: true
      }
    });

    if (!game) {
      throw new Error("Game not found.");
    }

    const gameType = await tx.gameType.findUnique({
      where: { id: gameTypeId }
    });

    if (!gameType) {
      throw new Error("Fee rule not found.");
    }

    await tx.game.update({
      where: { id: gameId },
      data: {
        gameTypeId
      }
    });

    for (const participation of game.participations) {
      await tx.gameParticipation.update({
        where: { id: participation.id },
        data: {
          feeCents: gameType.feeCents
        }
      });

      await tx.ledgerEntry.updateMany({
        where: { gameParticipationId: participation.id },
        data: {
          amountCents: gameType.feeCents
        }
      });
    }
  });
}

export async function deleteImportedGame(gameId: string) {
  return prisma.$transaction(async (tx) => {
    const participations = await tx.gameParticipation.findMany({
      where: { gameId },
      select: { id: true }
    });

    if (participations.length) {
      await tx.ledgerEntry.deleteMany({
        where: {
          gameParticipationId: {
            in: participations.map((participation) => participation.id)
          }
        }
      });
    }

    await tx.game.delete({
      where: { id: gameId }
    });
  });
}
