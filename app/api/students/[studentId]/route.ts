import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
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
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      gmailConnection: true,
    },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { gmailConnection, ...rest } = student;
  const safe = {
    ...rest,
    gmailConnection: gmailConnection
      ? {
          id: gmailConnection.id,
          status: gmailConnection.status,
          lastSyncAt: gmailConnection.lastSyncAt,
          provider: gmailConnection.provider,
        }
      : null,
  };
  return NextResponse.json(safe);
}

async function getValidStageSlugs(): Promise<string[]> {
  const stages = await prisma.stage.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true },
  });
  return stages.map((s) => s.slug);
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

  const body = await req.json();
  const isAdmin = role === "ADMIN";
  const isOwnStudent = role === "STUDENT" && sessionStudentId === studentId;
  const validSlugs = await getValidStageSlugs();
  const stageOk = body.stage != null && validSlugs.includes(String(body.stage));
  const data = isAdmin
    ? {
        ...(body.name != null && { name: body.name }),
        ...(body.studentEmail !== undefined && { studentEmail: body.studentEmail }),
        ...(body.gmailAddress !== undefined && { gmailAddress: body.gmailAddress }),
        ...(stageOk && { stage: body.stage }),
        ...(body.assignedConsultantId !== undefined && {
          assignedConsultantId: body.assignedConsultantId === "" || body.assignedConsultantId === null ? null : body.assignedConsultantId,
        }),
      }
    : isOwnStudent
      ? {
          ...(body.name != null && String(body.name).trim() && { name: String(body.name).trim() }),
          ...(body.studentEmail !== undefined && { studentEmail: body.studentEmail === "" ? null : body.studentEmail }),
        }
      : stageOk
        ? { stage: body.stage }
        : {};
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No valid update" }, { status: 400 });

  const student = await prisma.student.update({
    where: { id: studentId },
    data,
  });
  return NextResponse.json(student);
}
