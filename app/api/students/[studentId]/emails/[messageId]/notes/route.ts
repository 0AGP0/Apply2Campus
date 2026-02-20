import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Mail iç notlarını listele. messageId = gmailMessageId */
async function getMessage(studentId: string, messageId: string) {
  return prisma.emailMessage.findFirst({
    where: { studentId, gmailMessageId: messageId },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ studentId: string; messageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, messageId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await getMessage(studentId, messageId);
  if (!message) return NextResponse.json({ error: "Mail bulunamadı" }, { status: 404 });

  const notes = await prisma.emailInternalNote.findMany({
    where: { emailMessageId: message.id },
    orderBy: { createdAt: "asc" },
  });

  const users = await prisma.user.findMany({
    where: { id: { in: notes.map((n) => n.userId) } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.name ?? u.email]));

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      note: n.note,
      userId: n.userId,
      userName: userMap[n.userId] ?? "—",
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; messageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, messageId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role === "STUDENT") return NextResponse.json({ error: "Öğrenci iç not ekleyemez" }, { status: 403 });

  const message = await getMessage(studentId, messageId);
  if (!message) return NextResponse.json({ error: "Mail bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!note) return NextResponse.json({ error: "Not gerekli" }, { status: 400 });

  const created = await prisma.emailInternalNote.create({
    data: { emailMessageId: message.id, userId: session.user.id, note },
  });

  return NextResponse.json({
    note: {
      id: created.id,
      note: created.note,
      userId: created.userId,
      userName: session.user.name ?? session.user.email ?? "—",
      createdAt: created.createdAt.toISOString(),
    },
  });
}
