import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Operasyon mail detayı (ID ile - bağlı/bağsız fark etmez) */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isOperationRole((session.user as { role?: string }).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const message = await prisma.emailMessage.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true } },
      emailMessageBadges: { include: { badge: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!message) return NextResponse.json({ error: "Mail bulunamadı" }, { status: 404 });

  const thread = await prisma.emailMessage.findMany({
    where: {
      threadId: message.threadId,
      studentId: message.studentId,
    },
    orderBy: { internalDate: "asc" },
    include: {
      student: { select: { id: true, name: true } },
      emailMessageBadges: { include: { badge: { select: { id: true, name: true, color: true } } } },
    },
  });

  type MessageWithRelations = typeof message;
  const toMsg = (m: MessageWithRelations) => {
    const { emailMessageBadges, student, ...rest } = m;
    return {
      ...rest,
      badges: emailMessageBadges.map((b) => b.badge),
      studentName: student?.name ?? null,
    };
  };

  return NextResponse.json({
    message: toMsg(message),
    thread: thread.map(toMsg),
  });
}
