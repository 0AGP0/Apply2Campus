import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

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
  if (role === "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { badgeId, action } = body;
  if (!badgeId || !action || !["add", "remove"].includes(action))
    return NextResponse.json({ error: "badgeId and action (add|remove) required" }, { status: 400 });

  const message = await prisma.emailMessage.findFirst({
    where: { studentId, gmailMessageId: messageId },
    select: { id: true },
  });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
  if (!badge) return NextResponse.json({ error: "Badge not found" }, { status: 404 });

  if (action === "add") {
    await prisma.emailMessageBadge.upsert({
      where: {
        emailMessageId_badgeId: { emailMessageId: message.id, badgeId },
      },
      create: { emailMessageId: message.id, badgeId },
      update: {},
    });
  } else {
    await prisma.emailMessageBadge.deleteMany({
      where: { emailMessageId: message.id, badgeId },
    });
  }
  const badges = await prisma.emailMessageBadge.findMany({
    where: { emailMessageId: message.id },
    include: { badge: { select: { id: true, name: true, color: true } } },
  });
  return NextResponse.json({ badges: badges.map((b) => b.badge) });
}
