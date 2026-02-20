-- AlterTable
ALTER TABLE "Institution" ADD COLUMN "catalogPdfPath" TEXT;

-- CreateTable
CREATE TABLE "InstitutionImage" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionImage_institutionId_idx" ON "InstitutionImage"("institutionId");

-- AddForeignKey
ALTER TABLE "InstitutionImage" ADD CONSTRAINT "InstitutionImage_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
