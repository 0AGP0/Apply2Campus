-- Eksik tabloları oluştur (veri silmeden). Sunucuda bir kez çalıştır.
-- Kullanım (schema parametresi psql tarafından desteklenmediği için kaldırılır):
--   source .env && psql "${DATABASE_URL%%\?*}" -f docs/legacy-fixes/create-missing-tables.sql
-- veya:
--   psql "postgresql://postgres:postgre@localhost:5432/apply2campus" -f docs/legacy-fixes/create-missing-tables.sql

-- Announcement
CREATE TABLE IF NOT EXISTS "Announcement" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT,
  "startDate" DATE,
  "endDate" DATE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Announcement_active_idx" ON "Announcement"("active");
CREATE INDEX IF NOT EXISTS "Announcement_sortOrder_idx" ON "Announcement"("sortOrder");

-- InstitutionType enum + Institution
DO $$ BEGIN
  CREATE TYPE "InstitutionType" AS ENUM ('UNIVERSITY', 'LANGUAGE_COURSE', 'ACCOMMODATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Institution" (
  "id" TEXT NOT NULL,
  "type" "InstitutionType" NOT NULL,
  "name" TEXT NOT NULL,
  "logoUrl" TEXT,
  "description" TEXT,
  "address" TEXT,
  "catalogPdfPath" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Institution_type_idx" ON "Institution"("type");

-- InstitutionImage
CREATE TABLE IF NOT EXISTS "InstitutionImage" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstitutionImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InstitutionImage_institutionId_idx" ON "InstitutionImage"("institutionId");
DO $$ BEGIN
  ALTER TABLE "InstitutionImage" ADD CONSTRAINT "InstitutionImage_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- InstitutionServiceGroup + InstitutionService + InstitutionPrice
DO $$ BEGIN
  CREATE TYPE "InstitutionServiceGroup" AS ENUM ('EDUCATION', 'ACCOMMODATION', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "InstitutionService" (
  "id" TEXT NOT NULL,
  "institutionId" TEXT NOT NULL,
  "group" "InstitutionServiceGroup" NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstitutionService_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InstitutionService_institutionId_idx" ON "InstitutionService"("institutionId");
DO $$ BEGIN
  ALTER TABLE "InstitutionService" ADD CONSTRAINT "InstitutionService_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "InstitutionPrice" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstitutionPrice_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InstitutionPrice_serviceId_idx" ON "InstitutionPrice"("serviceId");
CREATE INDEX IF NOT EXISTS "InstitutionPrice_serviceId_startDate_endDate_idx" ON "InstitutionPrice"("serviceId", "startDate", "endDate");
DO $$ BEGIN
  ALTER TABLE "InstitutionPrice" ADD CONSTRAINT "InstitutionPrice_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "InstitutionService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ConsultantSlot + AppointmentRequest
DO $$ BEGIN
  CREATE TYPE "AppointmentRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "ConsultantSlot" (
  "id" TEXT NOT NULL,
  "consultantId" TEXT NOT NULL,
  "slotDate" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConsultantSlot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ConsultantSlot_consultantId_idx" ON "ConsultantSlot"("consultantId");
CREATE INDEX IF NOT EXISTS "ConsultantSlot_slotDate_idx" ON "ConsultantSlot"("slotDate");
DO $$ BEGIN
  ALTER TABLE "ConsultantSlot" ADD CONSTRAINT "ConsultantSlot_consultantId_fkey"
    FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "AppointmentRequest" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "consultantId" TEXT NOT NULL,
  "slotId" TEXT NOT NULL,
  "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AppointmentRequest_studentId_idx" ON "AppointmentRequest"("studentId");
CREATE INDEX IF NOT EXISTS "AppointmentRequest_consultantId_idx" ON "AppointmentRequest"("consultantId");
CREATE INDEX IF NOT EXISTS "AppointmentRequest_slotId_idx" ON "AppointmentRequest"("slotId");
DO $$ BEGIN
  ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_consultantId_fkey"
    FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_slotId_fkey"
    FOREIGN KEY ("slotId") REFERENCES "ConsultantSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Task
DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "assignedById" TEXT NOT NULL,
  "assignedToId" TEXT NOT NULL,
  "studentId" TEXT,
  "relatedEmailId" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Task_relatedEmailId_key" ON "Task"("relatedEmailId") WHERE "relatedEmailId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Task_assignedById_idx" ON "Task"("assignedById");
CREATE INDEX IF NOT EXISTS "Task_assignedToId_idx" ON "Task"("assignedToId");
CREATE INDEX IF NOT EXISTS "Task_studentId_idx" ON "Task"("studentId");
CREATE INDEX IF NOT EXISTS "Task_relatedEmailId_idx" ON "Task"("relatedEmailId");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedById_fkey"
    FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey"
    FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "Task" ADD CONSTRAINT "Task_relatedEmailId_fkey"
    FOREIGN KEY ("relatedEmailId") REFERENCES "EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
