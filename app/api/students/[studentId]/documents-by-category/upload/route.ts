import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { saveDocument } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  const categorySlug = formData.get("categorySlug");
  const file = formData.get("file");
  if (!categorySlug || typeof categorySlug !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "categorySlug and file required" }, { status: 400 });
  }

  const category = await prisma.documentCategory.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });

  if (category.type === "STUDENT_UPLOADED") {
    if (role !== "STUDENT" || sessionStudentId !== studentId)
      return NextResponse.json({ error: "Bu kategoride sadece öğrenci kendisi yükleyebilir" }, { status: 403 });
  } else {
    if (role === "STUDENT") return NextResponse.json({ error: "Operasyon belgeleri sadece operasyon/danışman yükler" }, { status: 403 });
  }

  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Dosya 20 MB'dan büyük olamaz" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Boş dosya yüklenemez" }, { status: 400 });
  const allowed = file.type && (ALLOWED_TYPES.includes(file.type) || file.type.startsWith("image/"));
  if (file.type && !allowed) return NextResponse.json({ error: "İzin verilmeyen dosya türü" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const documentId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const originalName = safeFilename(file.name, "dosya");
  const pathSlug = `cat_${category.slug}`;
  const relativePath = saveDocument(buffer, studentId, pathSlug, originalName, documentId);

  const existingCount = await prisma.studentDocumentByCategory.count({
    where: { studentId, categoryId: category.id },
  });
  const version = existingCount + 1;

  const doc = await prisma.studentDocumentByCategory.create({
    data: {
      studentId,
      categoryId: category.id,
      fileName: originalName,
      filePath: relativePath,
      mimeType: file.type || null,
      fileSize: file.size,
      version,
      uploadedBy: category.type === "OPERATION_UPLOADED" ? session.user.id : null,
    },
  });

  return NextResponse.json({
    id: doc.id,
    categorySlug: category.slug,
    categoryName: category.name,
    fileName: doc.fileName,
    uploadedAt: doc.uploadedAt,
    version: doc.version,
    status: doc.status,
  });
}
