-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('BASVURU_YAPILDI', 'KABUL_BEKLENIYOR', 'KABUL_ALINDI', 'REDDEDILDI');

-- CreateTable
CREATE TABLE "StudentApplication" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "program" TEXT,
    "applicationDate" TIMESTAMP(3),
    "status" "ApplicationStatus" NOT NULL DEFAULT 'BASVURU_YAPILDI',
    "notes" TEXT,
    "acceptanceDocumentId" TEXT,
    "secondInstallmentAmount" DECIMAL(12,2),
    "secondInstallmentDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentApplication_acceptanceDocumentId_key" ON "StudentApplication"("acceptanceDocumentId");

-- CreateIndex
CREATE INDEX "StudentApplication_studentId_idx" ON "StudentApplication"("studentId");

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentApplication" ADD CONSTRAINT "StudentApplication_acceptanceDocumentId_fkey" FOREIGN KEY ("acceptanceDocumentId") REFERENCES "StudentDocumentByCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
