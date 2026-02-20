-- AlterTable: EmailMessage.studentId optional (operasyon ortak inbox - mailleri öğrenciye bağlama)
ALTER TABLE "EmailMessage" ALTER COLUMN "studentId" DROP NOT NULL;

-- Drop old unique (studentId, gmailMessageId) - allows null studentId
DROP INDEX IF EXISTS "EmailMessage_studentId_gmailMessageId_key";

-- Partial unique: one unlinked mail per gmailMessageId
CREATE UNIQUE INDEX "EmailMessage_unlinked_gmail_key" ON "EmailMessage"("gmailMessageId") WHERE "studentId" IS NULL;

-- Partial unique: (studentId, gmailMessageId) when studentId is set
CREATE UNIQUE INDEX "EmailMessage_student_gmail_key" ON "EmailMessage"("studentId", "gmailMessageId") WHERE "studentId" IS NOT NULL;
