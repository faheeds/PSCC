-- Add isFinance flag to AdminUser
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "isFinance" BOOLEAN NOT NULL DEFAULT false;
