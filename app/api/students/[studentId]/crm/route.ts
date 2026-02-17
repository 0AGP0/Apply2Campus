import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

type ValueRow = { value: string; updatedAt: Date; crmField: { slug: string; label: string; type: string } };
type DocRow = { id: string; fileName: string; fileSize: number | null; uploadedAt: Date; crmField: { slug: string; label: string } };

/** Öğrencinin CRM değerleri ve belge listesi. Yetkili kullanıcı (danışman/admin/öğrenci kendisi). */
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

  const [values, documents] = await Promise.all([
    (prisma as unknown as { crmValue: { findMany: (args: unknown) => Promise<ValueRow[]> } }).crmValue.findMany({
      where: { studentId },
      include: { crmField: { select: { slug: true, label: true, type: true } } },
    }),
    (prisma as unknown as { studentDocument: { findMany: (args: unknown) => Promise<DocRow[]> } }).studentDocument.findMany({
      where: { studentId },
      include: { crmField: { select: { slug: true, label: true, allowMultiple: true } } },
      orderBy: { uploadedAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    values: values.map((v: ValueRow) => ({
      fieldSlug: v.crmField.slug,
      fieldLabel: v.crmField.label,
      type: v.crmField.type,
      value: v.value,
      updatedAt: v.updatedAt,
    })),
    documents: documents.map((d: DocRow) => ({
      id: d.id,
      fieldSlug: d.crmField.slug,
      fieldLabel: d.crmField.label,
      fileName: d.fileName,
      fileSize: d.fileSize,
      uploadedAt: d.uploadedAt,
    })),
  });
}
