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

  const applications = await prisma.studentApplication.findMany({
    where: { studentId },
    orderBy: { applicationDate: "desc" },
    include: {
      acceptanceDocument: {
        select: { id: true, fileName: true, status: true, uploadedAt: true },
      },
    },
  });

  return NextResponse.json({
    applications: applications.map((a) => ({
      ...a,
      secondInstallmentAmount: a.secondInstallmentAmount != null ? Number(a.secondInstallmentAmount) : null,
      applicationDate: a.applicationDate?.toISOString() ?? null,
      secondInstallmentDueDate: a.secondInstallmentDueDate?.toISOString() ?? null,
    })),
  });
}

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
  if (role === "STUDENT") return NextResponse.json({ error: "Öğrenci başvuru ekleyemez" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const universityName = typeof body.universityName === "string" ? body.universityName.trim() : "";
  if (!universityName) return NextResponse.json({ error: "Üniversite adı gerekli" }, { status: 400 });

  const program = typeof body.program === "string" ? body.program.trim() || null : null;
  const applicationDate = body.applicationDate ? new Date(body.applicationDate) : null;
  const status = ["BASVURU_YAPILDI", "KABUL_BEKLENIYOR", "KABUL_ALINDI", "REDDEDILDI"].includes(body.status)
    ? body.status
    : "BASVURU_YAPILDI";
  const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

  const app = await prisma.studentApplication.create({
    data: {
      studentId,
      universityName,
      program,
      applicationDate,
      status,
      notes,
    },
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
