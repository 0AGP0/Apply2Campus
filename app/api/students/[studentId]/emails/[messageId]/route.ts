import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { getMessageAttachments } from "@/lib/gmail";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; messageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, messageId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const message = await prisma.emailMessage.findFirst({
    where: { studentId, gmailMessageId: messageId },
    include: {
      emailMessageBadges: { include: { badge: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [threadMessages, attachments] = await Promise.all([
    prisma.emailMessage.findMany({
      where: { studentId, threadId: message.threadId },
      orderBy: { internalDate: "asc" },
      include: {
        emailMessageBadges: { include: { badge: { select: { id: true, name: true, color: true } } } },
      },
    }),
    getMessageAttachments(studentId, messageId).catch(() => []),
  ]);

  const toMessage = (m: typeof message) => {
    const { emailMessageBadges, ...rest } = m;
    return { ...rest, badges: emailMessageBadges.map((b) => b.badge) };
  };
  const messageJson = toMessage(message);
  return NextResponse.json({
    message: { ...messageJson, attachments },
    thread: threadMessages.map(toMessage),
  });
}
