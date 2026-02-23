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
        institutionId: i.institutionId,
        startDate: i.startDate?.toISOString().slice(0, 10) ?? null,
        endDate: i.endDate?.toISOString().slice(0, 10) ?? null,
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
    items?: Array<{
      city?: string;
      schoolName?: string;
      program?: string;
      programGroup?: string;
      durationWeeks?: number;
      amount: number;
      currency?: string;
      institutionId?: string;
      startDate?: string;
      endDate?: string;
    }>;
  };

  if (!title || typeof title !== "string" || !title.trim())
    return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  try {
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
              create: items.map((it, idx) => {
                const institutionId = typeof it.institutionId === "string" ? it.institutionId.trim() || null : null;
                const startDate = it.startDate ? new Date(it.startDate) : null;
                const endDate = it.endDate ? new Date(it.endDate) : null;
                const schoolName = typeof it.schoolName === "string" && it.schoolName.trim() ? it.schoolName.trim() : (institutionId ? "Kurum" : "—");
                const program = typeof it.program === "string" && it.program.trim() ? it.program.trim() : (institutionId ? "Hizmet" : "—");
                const city = typeof it.city === "string" && it.city.trim() ? it.city.trim() : schoolName;
                return {
                  city,
                  schoolName,
                  program,
                  programGroup: typeof it.programGroup === "string" ? it.programGroup : null,
                  durationWeeks: it.durationWeeks != null ? Number(it.durationWeeks) : null,
                  amount: Number(it.amount) || 0,
                  currency: typeof it.currency === "string" ? it.currency : null,
                  institutionId,
                  startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
                  endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
                  sortOrder: idx,
                };
              }),
            }
          : undefined,
    },
    include: { items: true },
  });

  return NextResponse.json(offer);
  } catch (e) {
    console.error("[api/students/[studentId]/offers POST]", e);
    const msg = e instanceof Error ? e.message : "Teklif eklenemedi.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
