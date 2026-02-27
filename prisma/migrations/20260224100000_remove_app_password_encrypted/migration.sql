-- AlterTable: Remove appPasswordEncrypted (revert to OAuth-only)
ALTER TABLE "GmailConnection" DROP COLUMN IF EXISTS "appPasswordEncrypted";
