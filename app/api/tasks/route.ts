import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Görev oluştur — danışman veya operasyon. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() || null : null;
  const assignedToId = typeof body.assignedToId === "string" ? body.assignedToId.trim() : "";
  const studentId = typeof body.studentId === "string" ? body.studentId.trim() || null : null;
  const relatedEmailId = typeof body.relatedEmailId === "string" ? body.relatedEmailId.trim() || null : null;

  if (!title) return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });
  if (!assignedToId) return NextResponse.json({ error: "Atanacak kişi gerekli" }, { status: 400 });

  const assignee = await prisma.user.findFirst({
    where: {
      id: assignedToId,
      OR: [
        { role: "CONSULTANT" },
        { role: "OPERATION_UNIVERSITY" },
        { role: "OPERATION_ACCOMMODATION" },
        { role: "OPERATION_VISA" },
      ],
    },
  });
  if (!assignee) return NextResponse.json({ error: "Geçersiz atanacak kullanıcı" }, { status: 400 });

  if (assignee.id === session.user.id) return NextResponse.json({ error: "Kendinize görev atayamazsınız" }, { status: 400 });

  if (studentId) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return NextResponse.json({ error: "Geçersiz öğrenci" }, { status: 400 });
  }

  if (relatedEmailId) {
    const email = await prisma.emailMessage.findUnique({
      where: { id: relatedEmailId },
      select: { id: true, studentId: true },
    });
    if (!email) return NextResponse.json({ error: "Geçersiz mail referansı" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      assignedById: session.user.id,
      assignedToId: assignee.id,
      studentId,
      relatedEmailId,
    },
    include: {
      assignedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdAt: task.createdAt.toISOString(),
      assignedBy: { id: task.assignedBy.id, name: task.assignedBy.name ?? task.assignedBy.email },
      assignedTo: { id: task.assignedTo.id, name: task.assignedTo.name ?? task.assignedTo.email },
      student: task.student ? { id: task.student.id, name: task.student.name } : null,
    },
  });
}
