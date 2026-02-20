import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(10, parseInt(req.nextUrl.searchParams.get("pageSize") ?? "25", 10)));
  const studentId = req.nextUrl.searchParams.get("studentId") ?? "";
  const search = req.nextUrl.searchParams.get("search") ?? "";

  const where: {
    studentId?: string | null;
    OR?: Array<{
      subject?: { contains: string; mode: "insensitive" };
      snippet?: { contains: string; mode: "insensitive" };
      from?: { contains: string; mode: "insensitive" };
    }>;
  } = {};
  if (studentId === "__unlinked__") where.studentId = null;
  else if (studentId) where.studentId = studentId;
  if (search.trim()) {
    where.OR = [
      { subject: { contains: search.trim(), mode: "insensitive" } },
      { snippet: { contains: search.trim(), mode: "insensitive" } },
      { from: { contains: search.trim(), mode: "insensitive" } },
    ];
  }

  const [messages, total] = await Promise.all([
    prisma.emailMessage.findMany({
      where,
      orderBy: { internalDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        studentId: true,
        gmailMessageId: true,
        threadId: true,
        from: true,
        to: true,
        subject: true,
        snippet: true,
        internalDate: true,
        labels: true,
        student: { select: { id: true, name: true } },
        emailMessageBadges: {
          select: { badge: { select: { id: true, name: true, color: true } } },
        },
      },
    }),
    prisma.emailMessage.count({ where }),
  ]);

  const list = messages.map((m) => {
    const { emailMessageBadges, student, ...rest } = m;
    return {
      ...rest,
      studentName: student?.name ?? "",
      badges: emailMessageBadges.map((b) => b.badge),
    };
  });

  return NextResponse.json({
    messages: list,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
