import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(
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

  const label = req.nextUrl.searchParams.get("label") ?? "INBOX";
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const folderId = req.nextUrl.searchParams.get("folderId") ?? "";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(10, parseInt(req.nextUrl.searchParams.get("pageSize") ?? "50", 10)));

  let fromAddress: string | null = null;
  if (folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: folderId, studentId },
      select: { fromAddress: true },
    });
    if (folder?.fromAddress) fromAddress = folder.fromAddress;
  }

  const where: Record<string, unknown> = { studentId };
  if (label === "INBOX") (where as { labels?: { contains: string } }).labels = { contains: "INBOX" };
  if (label === "SENT") (where as { labels?: { contains: string } }).labels = { contains: "SENT" };
  if (fromAddress) (where as { from?: { contains: string } }).from = { contains: fromAddress };

  const baseWhere = search
    ? {
        ...where,
        OR: [
          { subject: { contains: search, mode: "insensitive" as const } },
          { snippet: { contains: search, mode: "insensitive" as const } },
          { from: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : where;

  const [messages, total] = await Promise.all([
    prisma.emailMessage.findMany({
      where: baseWhere,
      orderBy: { internalDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        gmailMessageId: true,
        threadId: true,
        from: true,
        to: true,
        subject: true,
        snippet: true,
        internalDate: true,
        labels: true,
        emailMessageBadges: {
          select: { badge: { select: { id: true, name: true, color: true } } },
        },
      },
    }),
    prisma.emailMessage.count({ where: baseWhere }),
  ]);

  const messagesWithBadges = messages.map((m) => {
    const { emailMessageBadges, ...rest } = m;
    return {
      ...rest,
      badges: emailMessageBadges.map((b) => b.badge),
    };
  });

  return NextResponse.json({
    messages: messagesWithBadges,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
