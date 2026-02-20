import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Öğrenci: kendi taleplerim. Danışman: bana gelen talepler. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const studentId = (session.user as { studentId?: string }).studentId;

  if (role === "STUDENT" && studentId) {
    const requests = await prisma.appointmentRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        slot: { select: { slotDate: true, startTime: true, endTime: true } },
        consultant: { select: { id: true, name: true, image: true } },
      },
    });
    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        slotId: r.slotId,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
        slotDate: r.slot.slotDate.toISOString().slice(0, 10),
        startTime: r.slot.startTime,
        endTime: r.slot.endTime,
        consultant: r.consultant,
      })),
    });
  }

  if (role === "CONSULTANT" || role === "ADMIN") {
    const requests = await prisma.appointmentRequest.findMany({
      where: { consultantId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        slot: { select: { slotDate: true, startTime: true, endTime: true } },
        student: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        slotId: r.slotId,
        studentId: r.studentId,
        status: r.status,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
        slotDate: r.slot.slotDate.toISOString().slice(0, 10),
        startTime: r.slot.startTime,
        endTime: r.slot.endTime,
        student: r.student,
      })),
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/** Öğrenci görüşme talebi oluşturur. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const studentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || !studentId) return NextResponse.json({ error: "Sadece öğrenci görüşme talebi oluşturabilir" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const slotId = typeof body.slotId === "string" ? body.slotId.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() || null : null;

  if (!slotId) return NextResponse.json({ error: "Slot seçin" }, { status: 400 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { assignedConsultantId: true },
  });
  if (!student?.assignedConsultantId) return NextResponse.json({ error: "Size atanmış danışman bulunamadı" }, { status: 400 });

  const slot = await prisma.consultantSlot.findFirst({
    where: { id: slotId, consultantId: student.assignedConsultantId },
    include: {
      appointmentRequests: { where: { status: "CONFIRMED" } },
    },
  });
  if (!slot) return NextResponse.json({ error: "Geçersiz veya müsait olmayan slot" }, { status: 404 });
  if (slot.appointmentRequests.length > 0) return NextResponse.json({ error: "Bu slot artık müsait değil" }, { status: 400 });

  const existing = await prisma.appointmentRequest.findFirst({
    where: { studentId, slotId, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Bu slot için zaten bekleyen talebiniz var" }, { status: 400 });

  const request = await prisma.appointmentRequest.create({
    data: { studentId, consultantId: student.assignedConsultantId, slotId, note },
    include: {
      slot: { select: { slotDate: true, startTime: true, endTime: true } },
      consultant: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    request: {
      id: request.id,
      status: request.status,
      slotDate: request.slot.slotDate.toISOString().slice(0, 10),
      startTime: request.slot.startTime,
      endTime: request.slot.endTime,
      consultant: request.consultant,
    },
  });
}
