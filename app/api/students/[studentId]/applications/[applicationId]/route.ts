import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string; applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, applicationId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const app = await prisma.studentApplication.findFirst({
    where: { id: applicationId, studentId },
    include: {
      acceptanceDocument: {
        select: { id: true, fileName: true, status: true, uploadedAt: true },
      },
    },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    application: {
      ...app,
      secondInstallmentAmount: app.secondInstallmentAmount != null ? Number(app.secondInstallmentAmount) : null,
      applicationDate: app.applicationDate?.toISOString() ?? null,
      secondInstallmentDueDate: app.secondInstallmentDueDate?.toISOString() ?? null,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, applicationId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role === "STUDENT") return NextResponse.json({ error: "Öğrenci başvuru güncelleyemez" }, { status: 403 });

  const existing = await prisma.studentApplication.findFirst({
    where: { id: applicationId, studentId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.universityName === "string" && body.universityName.trim())
    data.universityName = body.universityName.trim();
  if (body.program !== undefined) data.program = typeof body.program === "string" ? body.program.trim() || null : null;
  if (body.applicationDate !== undefined) data.applicationDate = body.applicationDate ? new Date(body.applicationDate) : null;
  if (["BASVURU_YAPILDI", "KABUL_BEKLENIYOR", "KABUL_ALINDI", "REDDEDILDI"].includes(body.status))
    data.status = body.status;
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
  if (body.acceptanceDocumentId !== undefined)
    data.acceptanceDocumentId = body.acceptanceDocumentId ? String(body.acceptanceDocumentId) : null;
  if (body.secondInstallmentAmount !== undefined) {
    const v = body.secondInstallmentAmount;
    data.secondInstallmentAmount = v === null || v === "" ? null : Number(v) || null;
  }
  if (body.secondInstallmentDueDate !== undefined)
    data.secondInstallmentDueDate = body.secondInstallmentDueDate ? new Date(body.secondInstallmentDueDate) : null;

  const app = await prisma.studentApplication.update({
    where: { id: applicationId },
    data,
  });

  return NextResponse.json({
    application: {
      ...app,
      secondInstallmentAmount: app.secondInstallmentAmount != null ? Number(app.secondInstallmentAmount) : null,
      applicationDate: app.applicationDate?.toISOString() ?? null,
      secondInstallmentDueDate: app.secondInstallmentDueDate?.toISOString() ?? null,
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ studentId: string; applicationId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, applicationId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role === "STUDENT") return NextResponse.json({ error: "Öğrenci başvuru silemez" }, { status: 403 });

  const existing = await prisma.studentApplication.findFirst({
    where: { id: applicationId, studentId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.studentApplication.delete({ where: { id: applicationId } });
  return NextResponse.json({ ok: true });
}
