import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Danışman talebi onaylar veya reddeder. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "CONSULTANT" && role !== "ADMIN") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { requestId } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status === "CONFIRMED" || body.status === "REJECTED" ? body.status : null;
  if (!status) return NextResponse.json({ error: "Geçerli durum gerekli (CONFIRMED/REJECTED)" }, { status: 400 });

  const req_ = await prisma.appointmentRequest.findUnique({
    where: { id: requestId },
    include: { slot: true },
  });
  if (!req_) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
  if (req_.consultantId !== session.user.id && role !== "ADMIN") return NextResponse.json({ error: "Bu talebe erişemezsiniz" }, { status: 403 });
  if (req_.status !== "PENDING") return NextResponse.json({ error: "Talep zaten işlenmiş" }, { status: 400 });

  if (status === "CONFIRMED") {
    const otherConfirmed = await prisma.appointmentRequest.findFirst({
      where: { slotId: req_.slotId, status: "CONFIRMED", id: { not: requestId } },
    });
    if (otherConfirmed) return NextResponse.json({ error: "Bu slot zaten başka talebe onaylanmış" }, { status: 400 });
  }

  const updated = await prisma.appointmentRequest.update({
    where: { id: requestId },
    data: { status },
    include: {
      slot: { select: { slotDate: true, startTime: true, endTime: true } },
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    request: {
      id: updated.id,
      status: updated.status,
      slotDate: updated.slot.slotDate.toISOString().slice(0, 10),
      startTime: updated.slot.startTime,
      endTime: updated.slot.endTime,
      student: updated.student,
    },
  });
}
