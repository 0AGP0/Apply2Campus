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

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { visaInstitution: true, visaCity: true, visaProgramStartDate: true, visaNotes: true },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    visaInstitution: student.visaInstitution,
    visaCity: student.visaCity,
    visaProgramStartDate: student.visaProgramStartDate?.toISOString()?.slice(0, 10) ?? null,
    visaNotes: student.visaNotes,
  });
}

export async function PATCH(
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
  if (role === "STUDENT") return NextResponse.json({ error: "Sadece danışman/operasyon güncelleyebilir" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const visaInstitution = typeof body.visaInstitution === "string" ? body.visaInstitution.trim() || null : undefined;
  const visaCity = typeof body.visaCity === "string" ? body.visaCity.trim() || null : undefined;
  const visaProgramStartDate = body.visaProgramStartDate !== undefined ? (body.visaProgramStartDate ? new Date(body.visaProgramStartDate) : null) : undefined;
  const visaNotes = typeof body.visaNotes === "string" ? body.visaNotes.trim() || null : undefined;

  const data: { visaInstitution?: string | null; visaCity?: string | null; visaProgramStartDate?: Date | null; visaNotes?: string | null } = {};
  if (visaInstitution !== undefined) data.visaInstitution = visaInstitution;
  if (visaCity !== undefined) data.visaCity = visaCity;
  if (visaProgramStartDate !== undefined) data.visaProgramStartDate = visaProgramStartDate;
  if (visaNotes !== undefined) data.visaNotes = visaNotes;

  await prisma.student.update({
    where: { id: studentId },
    data,
  });

  return NextResponse.json({ ok: true });
}
