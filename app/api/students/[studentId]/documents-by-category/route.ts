import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const docs = await prisma.studentDocumentByCategory.findMany({
    where: { studentId },
    include: { category: { select: { slug: true, name: true, type: true } } },
    orderBy: [{ categoryId: "asc" }, { version: "desc" }],
  });

  const list = docs.map((d) => ({
    id: d.id,
    categorySlug: d.category.slug,
    categoryName: d.category.name,
    categoryType: d.category.type,
    fileName: d.fileName,
    fileSize: d.fileSize,
    version: d.version,
    status: d.status,
    uploadedAt: d.uploadedAt,
  }));

  return NextResponse.json({ documents: list });
}
