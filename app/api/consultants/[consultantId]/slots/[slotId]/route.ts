import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Slot sil. Sadece ilgili danışman. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ consultantId: string; slotId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { consultantId, slotId } = await params;
  if (session.user.id !== consultantId) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const slot = await prisma.consultantSlot.findFirst({
    where: { id: slotId, consultantId },
  });
  if (!slot) return NextResponse.json({ error: "Slot bulunamadı" }, { status: 404 });

  const hasConfirmed = await prisma.appointmentRequest.count({
    where: { slotId, status: "CONFIRMED" },
  });
  if (hasConfirmed > 0) return NextResponse.json({ error: "Onaylı görüşme olan slot silinemez" }, { status: 400 });

  await prisma.consultantSlot.delete({ where: { id: slotId } });
  return NextResponse.json({ ok: true });
}
