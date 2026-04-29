-- Safe enum creation using DO blocks (handles already-existing types)
DO $$ BEGIN
  CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'MAYBE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BattingStyle" AS ENUM ('RIGHT_HAND', 'LEFT_HAND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BowlingStyle" AS ENUM ('RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_SPIN_OFF', 'RIGHT_ARM_SPIN_LEG', 'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_SPIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PlayerRole" AS ENUM ('BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AlterTable Member - add cricket profile fields (safe)
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "battingStyle" "BattingStyle";
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "bowlingStyle" "BowlingStyle";
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "playerRole" "PlayerRole";
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "bio" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "jerseyNumber" INTEGER;

-- AlterTable Game - add result fields (safe)
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "psccScore" TEXT;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "opponentScore" TEXT;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "result" TEXT;
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "manOfMatch" TEXT;

-- AlterTable GameParticipation - add batting position (safe)
ALTER TABLE "GameParticipation" ADD COLUMN IF NOT EXISTS "battingPosition" INTEGER;

-- CreateTable GameAvailability (safe)
CREATE TABLE IF NOT EXISTS "GameAvailability" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GameAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable BattingPerformance (safe)
CREATE TABLE IF NOT EXISTS "BattingPerformance" (
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

-- CreateTable BowlingPerformance (safe)
CREATE TABLE IF NOT EXISTS "BowlingPerformance" (
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

-- CreateTable NotificationToken (safe)
CREATE TABLE IF NOT EXISTS "NotificationToken" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (safe)
CREATE UNIQUE INDEX IF NOT EXISTS "GameAvailability_gameId_memberId_key" ON "GameAvailability"("gameId", "memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "BattingPerformance_gameId_memberId_key" ON "BattingPerformance"("gameId", "memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "BowlingPerformance_gameId_memberId_key" ON "BowlingPerformance"("gameId", "memberId");
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationToken_token_key" ON "NotificationToken"("token");

-- AddForeignKey (safe)
DO $$ BEGIN
  ALTER TABLE "GameAvailability" ADD CONSTRAINT "GameAvailability_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "GameAvailability" ADD CONSTRAINT "GameAvailability_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BattingPerformance" ADD CONSTRAINT "BattingPerformance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BattingPerformance" ADD CONSTRAINT "BattingPerformance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BowlingPerformance" ADD CONSTRAINT "BowlingPerformance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "BowlingPerformance" ADD CONSTRAINT "BowlingPerformance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
