-- CreateEnum
CREATE TYPE "AppointmentRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "ConsultantSlot" (
    "id" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "slotDate" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultantSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "consultantId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsultantSlot_consultantId_idx" ON "ConsultantSlot"("consultantId");

-- CreateIndex
CREATE INDEX "ConsultantSlot_slotDate_idx" ON "ConsultantSlot"("slotDate");

-- CreateIndex
CREATE INDEX "AppointmentRequest_studentId_idx" ON "AppointmentRequest"("studentId");

-- CreateIndex
CREATE INDEX "AppointmentRequest_consultantId_idx" ON "AppointmentRequest"("consultantId");

-- CreateIndex
CREATE INDEX "AppointmentRequest_slotId_idx" ON "AppointmentRequest"("slotId");

-- AddForeignKey
ALTER TABLE "ConsultantSlot" ADD CONSTRAINT "ConsultantSlot_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "ConsultantSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
