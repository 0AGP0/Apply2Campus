import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string; offerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, offerId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, studentId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!offer) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });

  if (role === "STUDENT" && offer.status === "SENT") {
    await prisma.offer.update({
      where: { id: offerId },
      data: { status: "VIEWED", viewedAt: offer.viewedAt ?? new Date() },
    });
  }

  return NextResponse.json({
    ...offer,
    items: offer.items.map((i) => ({ ...i, amount: Number(i.amount) })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; offerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId, offerId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (role !== "ADMIN" && role !== "CONSULTANT")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const offer = await prisma.offer.findFirst({ where: { id: offerId, studentId } });
  if (!offer) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  if (offer.status !== "DRAFT" && offer.status !== "REVISION_REQUESTED")
    return NextResponse.json({ error: "Sadece taslak veya revizyon isteği güncellenebilir" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const { title, summary, body: bodyText, status, items } = body;

  const data: { title?: string; summary?: string | null; body?: string | null; status?: string; sentAt?: Date } = {};
  if (title !== undefined) data.title = String(title).trim();
  if (summary !== undefined) data.summary = summary ? String(summary).trim() : null;
  if (bodyText !== undefined) data.body = bodyText ? String(bodyText).trim() : null;
  if (status === "SENT") {
    data.status = "SENT";
    data.sentAt = new Date();
  }

  if (Array.isArray(items)) {
    await prisma.offerItem.deleteMany({ where: { offerId } });
    await prisma.offerItem.createMany({
      data: items.map((it: { city: string; schoolName: string; program: string; programGroup?: string; durationWeeks: number; amount: number; currency?: string }, idx: number) => ({
        offerId,
        city: String(it.city),
        schoolName: String(it.schoolName),
        program: String(it.program),
        programGroup: it.programGroup ?? null,
        durationWeeks: Number(it.durationWeeks) || 0,
        amount: Number(it.amount) || 0,
        currency: it.currency ?? null,
        sortOrder: idx,
      })),
    });
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data,
    include: { items: true },
  });

  return NextResponse.json(updated);
}
