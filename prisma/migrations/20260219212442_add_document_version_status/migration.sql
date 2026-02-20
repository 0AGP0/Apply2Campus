-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'APPROVED', 'REVISION_REQUESTED');

-- AlterTable
ALTER TABLE "StudentDocument" ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
