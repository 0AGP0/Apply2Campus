import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { saveDocument } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** FormData: fieldSlug (string), file (File). Öğrenci kendisi veya danışman/admin yükleyebilir. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const fieldSlug = formData.get("fieldSlug");
  const file = formData.get("file");
  if (!fieldSlug || typeof fieldSlug !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "fieldSlug and file required" }, { status: 400 });
  }

  const crmField = await prisma.crmField.findUnique({
    where: { slug: fieldSlug, type: "FILE" },
  });
  if (!crmField) return NextResponse.json({ error: "Invalid field or not a file field" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Dosya 20 MB'dan büyük olamaz" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Boş dosya yüklenemez" }, { status: 400 });
  const allowed = file.type && (ALLOWED_TYPES.includes(file.type) || file.type.startsWith("image/"));
  if (file.type && !allowed) {
    return NextResponse.json({ error: "İzin verilmeyen dosya türü. PDF, Word veya resim yükleyin." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const documentId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const originalName = safeFilename(file.name, "dosya");
  const relativePath = saveDocument(buffer, studentId, fieldSlug, originalName, documentId);

  const existingCount = await prisma.studentDocument.count({
    where: { studentId, crmFieldId: crmField.id },
  });
  const version = existingCount + 1;

  const doc = await prisma.studentDocument.create({
    data: {
      studentId,
      crmFieldId: crmField.id,
      fileName: originalName,
      filePath: relativePath,
      mimeType: file.type || null,
      fileSize: file.size,
      version,
    },
  });

  return NextResponse.json({
    id: doc.id,
    fieldSlug,
    fileName: doc.fileName,
    uploadedAt: doc.uploadedAt,
    version: doc.version,
    status: doc.status,
  });
}
