-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAYBE');

-- CreateEnum
CREATE TYPE "BattingStyle" AS ENUM ('RIGHT_HAND', 'LEFT_HAND');

-- CreateEnum
CREATE TYPE "BowlingStyle" AS ENUM ('RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_SPIN_OFF', 'RIGHT_ARM_SPIN_LEG', 'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_SPIN');

-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN');

-- AlterTable Member - add cricket profile fields
ALTER TABLE "Member" ADD COLUMN "battingStyle" "BattingStyle";
ALTER TABLE "Member" ADD COLUMN "bowlingStyle" "BowlingStyle";
ALTER TABLE "Member" ADD COLUMN "playerRole" "PlayerRole";
ALTER TABLE "Member" ADD COLUMN "bio" TEXT;
ALTER TABLE "Member" ADD COLUMN "jerseyNumber" INTEGER;

-- AlterTable Game - add result fields
ALTER TABLE "Game" ADD COLUMN "psccScore" TEXT;
ALTER TABLE "Game" ADD COLUMN "opponentScore" TEXT;
ALTER TABLE "Game" ADD COLUMN "result" TEXT;
ALTER TABLE "Game" ADD COLUMN "manOfMatch" TEXT;

-- AlterTable GameParticipation - add batting position
ALTER TABLE "GameParticipation" ADD COLUMN "battingPosition" INTEGER;

-- CreateTable GameAvailability
CREATE TABLE "GameAvailability" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable BattingPerformance
CREATE TABLE "BattingPerformance" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "fours" INTEGER NOT NULL DEFAULT 0,
    "sixes" INTEGER NOT NULL DEFAULT 0,
    "isOut" BOOLEAN NOT NULL DEFAULT false,
    "dismissal" TEXT,
    "bowler" TEXT,
    "battingOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BattingPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable BowlingPerformance
CREATE TABLE "BowlingPerformance" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "overs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maidens" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "wickets" INTEGER NOT NULL DEFAULT 0,
    "wides" INTEGER NOT NULL DEFAULT 0,
    "noBalls" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BowlingPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable NotificationToken
CREATE TABLE "NotificationToken" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameAvailability_gameId_memberId_key" ON "GameAvailability"("gameId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "BattingPerformance_gameId_memberId_key" ON "BattingPerformance"("gameId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "BowlingPerformance_gameId_memberId_key" ON "BowlingPerformance"("gameId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationToken_token_key" ON "NotificationToken"("token");

-- AddForeignKey
ALTER TABLE "GameAvailability" ADD CONSTRAINT "GameAvailability_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameAvailability" ADD CONSTRAINT "GameAvailability_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattingPerformance" ADD CONSTRAINT "BattingPerformance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BattingPerformance" ADD CONSTRAINT "BattingPerformance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BowlingPerformance" ADD CONSTRAINT "BowlingPerformance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BowlingPerformance" ADD CONSTRAINT "BowlingPerformance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
