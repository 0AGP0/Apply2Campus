import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Danışmanın müsait slotlarını listele. Öğrenci sadece kendi danışmanının slotlarını görebilir. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ consultantId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { consultantId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let fromDate: Date;
  let toDate: Date;
  if (from && to) {
    const d1 = new Date(from);
    const d2 = new Date(to);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      fromDate = d1;
      toDate = d2;
    } else {
      const now = new Date();
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + 13);
    }
  } else {
    const now = new Date();
    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 13);
  }

  if (role === "STUDENT" && sessionStudentId) {
    const student = await prisma.student.findUnique({
      where: { id: sessionStudentId },
      select: { assignedConsultantId: true },
    });
    if (student?.assignedConsultantId !== consultantId) {
      return NextResponse.json({ error: "Bu danışmanın slotlarına erişemezsiniz" }, { status: 403 });
    }
  } else if (role !== "ADMIN" && !["OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"].includes(role ?? "")) {
    if (session.user.id !== consultantId) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
  }

  const slots = await prisma.consultantSlot.findMany({
    where: {
      consultantId,
      slotDate: { gte: fromDate, lte: toDate },
    },
    orderBy: [{ slotDate: "asc" }, { startTime: "asc" }],
    include: {
      appointmentRequests: {
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
        select: { id: true, status: true, studentId: true },
      },
    },
  });

  const slotDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return NextResponse.json({
    slots: slots.map((s) => ({
      id: s.id,
      slotDate: slotDateStr(s.slotDate),
      startTime: s.startTime,
      endTime: s.endTime,
      available: !s.appointmentRequests.some((r) => r.status === "CONFIRMED"),
      pendingCount: s.appointmentRequests.filter((r) => r.status === "PENDING").length,
    })),
  });
}

/** Danışman kendi slotu oluşturur. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ consultantId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { consultantId } = await params;
  if (session.user.id !== consultantId) {
    return NextResponse.json({ error: "Sadece kendi slotlarınızı oluşturabilirsiniz" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const slotDate = body.slotDate ? new Date(body.slotDate) : null;
  const startTime = typeof body.startTime === "string" ? body.startTime.trim() : "";
  const endTime = typeof body.endTime === "string" ? body.endTime.trim() : "";

  if (!slotDate || isNaN(slotDate.getTime())) return NextResponse.json({ error: "Geçerli tarih gerekli" }, { status: 400 });
  if (!startTime || !/^\d{1,2}:\d{2}$/.test(startTime)) return NextResponse.json({ error: "Geçerli başlangıç saati gerekli (HH:mm)" }, { status: 400 });
  if (!endTime || !/^\d{1,2}:\d{2}$/.test(endTime)) return NextResponse.json({ error: "Geçerli bitiş saati gerekli (HH:mm)" }, { status: 400 });

  const slot = await prisma.consultantSlot.create({
    data: {
      consultantId,
      slotDate: new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate()),
      startTime,
      endTime,
    },
  });

  const slotDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return NextResponse.json({
    slot: {
      id: slot.id,
      slotDate: slotDateStr(slot.slotDate),
      startTime: slot.startTime,
      endTime: slot.endTime,
    },
  });
}
