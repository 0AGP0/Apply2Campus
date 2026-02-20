import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Maili öğrenci dosyasına bağla veya bağlantıyı değiştir */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOperationRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: messageId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const studentId = body.studentId === null ? null : (typeof body.studentId === "string" ? body.studentId.trim() || null : null);

  const msg = await prisma.emailMessage.findUnique({ where: { id: messageId } });
  if (!msg) return NextResponse.json({ error: "Mail bulunamadı" }, { status: 404 });

  if (studentId === null) {
    await prisma.emailMessage.update({
      where: { id: messageId },
      data: { studentId: null },
    });
    return NextResponse.json({ ok: true, studentId: null });
  }

  if (!studentId) return NextResponse.json({ error: "studentId gerekli" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  const existing = await prisma.emailMessage.findFirst({
    where: { studentId, gmailMessageId: msg.gmailMessageId, id: { not: messageId } },
  });
  if (existing) return NextResponse.json({ error: "Bu mail zaten bu öğrenci dosyasında" }, { status: 400 });

  await prisma.emailMessage.update({
    where: { id: messageId },
    data: { studentId },
  });

  return NextResponse.json({ ok: true, studentId });
}
