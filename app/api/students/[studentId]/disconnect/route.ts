import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function POST(
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

  await prisma.gmailConnection.updateMany({
    where: { studentId },
    data: {
      status: "disconnected",
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      expiryDate: null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      studentId,
      type: "disconnect",
      message: "Gmail disconnected",
      level: "info",
    },
  });
  return NextResponse.json({ ok: true });
}
