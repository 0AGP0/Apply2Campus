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

  const list = await prisma.offer.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    offers: list.map((o) => ({
      id: o.id,
      title: o.title,
      summary: o.summary,
      status: o.status,
      sentAt: o.sentAt,
      viewedAt: o.viewedAt,
      respondedAt: o.respondedAt,
      responseNote: o.responseNote,
      createdAt: o.createdAt,
      createdBy: o.createdBy,
      items: o.items.map((i) => ({
        id: i.id,
        city: i.city,
        schoolName: i.schoolName,
        program: i.program,
        programGroup: i.programGroup,
        durationWeeks: i.durationWeeks,
        amount: Number(i.amount),
        currency: i.currency,
      })),
    })),
  });
}

export async function POST(
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
  if (role !== "ADMIN" && role !== "CONSULTANT")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { title, summary, body: bodyText, status, items } = body as {
    title?: string;
    summary?: string;
    body?: string;
    status?: string;
    items?: { city: string; schoolName: string; program: string; programGroup?: string; durationWeeks: number; amount: number; currency?: string }[];
  };

  if (!title || typeof title !== "string" || !title.trim())
    return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  const offerStatus = status === "SENT" ? "SENT" : "DRAFT";
  const offer = await prisma.offer.create({
    data: {
      studentId,
      createdById: session.user.id,
      title: title.trim(),
      summary: summary?.trim() ?? null,
      body: bodyText?.trim() ?? null,
      status: offerStatus,
      sentAt: offerStatus === "SENT" ? new Date() : null,
      items:
        Array.isArray(items) && items.length > 0
          ? {
              create: items.map((it: { city: string; schoolName: string; program: string; programGroup?: string; durationWeeks: number; amount: number; currency?: string }, idx: number) => ({
                city: String(it.city),
                schoolName: String(it.schoolName),
                program: String(it.program),
                programGroup: it.programGroup ?? null,
                durationWeeks: Number(it.durationWeeks) || 0,
                amount: Number(it.amount) || 0,
                currency: it.currency ?? null,
                sortOrder: idx,
              })),
            }
          : undefined,
    },
    include: { items: true },
  });

  return NextResponse.json(offer);
}
