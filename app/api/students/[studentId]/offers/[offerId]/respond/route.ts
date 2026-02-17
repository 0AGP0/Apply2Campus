import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createConsultantNotification } from "@/lib/notifications";

/** Öğrenci teklife kabul/red/revize iste yanıtı verir. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; offerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || sessionStudentId !== (await params).studentId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentId, offerId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, note } = body as { status?: string; note?: string };
  const validStatus = ["ACCEPTED", "REJECTED", "REVISION_REQUESTED"].find((s) => s === status);
  if (!validStatus) return NextResponse.json({ error: "status: ACCEPTED, REJECTED veya REVISION_REQUESTED olmalı" }, { status: 400 });

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, studentId },
    include: { student: { select: { assignedConsultantId: true, name: true } } },
  });
  if (!offer) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  if (offer.status === "ACCEPTED" || offer.status === "REJECTED")
    return NextResponse.json({ error: "Bu teklif zaten yanıtlanmış" }, { status: 400 });

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: validStatus,
      respondedAt: new Date(),
      responseNote: note ? String(note).trim() : null,
    },
  });

  const consultantId = offer.student.assignedConsultantId;
  if (consultantId) {
    const msg =
      validStatus === "ACCEPTED"
        ? `Öğrenci teklifi kabul etti: ${offer.title}`
        : validStatus === "REJECTED"
          ? `Öğrenci teklifi reddetti: ${offer.title}`
          : `Öğrenci revizyon istedi: ${offer.title}`;
    await createConsultantNotification(consultantId, "STUDENT_UPDATED", studentId, msg).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
