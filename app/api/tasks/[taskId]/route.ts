import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Görev durumunu güncelle — sadece atanan kişi (assignedTo). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { taskId } = await params;
  const body = await req.json().catch(() => ({}));
  const status = ["PENDING", "IN_PROGRESS", "DONE"].includes(body.status) ? body.status : null;
  if (!status) return NextResponse.json({ error: "Geçerli durum gerekli (PENDING, IN_PROGRESS, DONE)" }, { status: 400 });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "Görev bulunamadı" }, { status: 404 });
  if (task.assignedToId !== session.user.id && role !== "ADMIN") {
    return NextResponse.json({ error: "Bu görevi güncelleme yetkiniz yok" }, { status: 403 });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignedBy: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    task: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      createdAt: updated.createdAt.toISOString(),
      assignedBy: { id: updated.assignedBy.id, name: updated.assignedBy.name ?? updated.assignedBy.email },
      assignedTo: { id: updated.assignedTo.id, name: updated.assignedTo.name ?? updated.assignedTo.email },
      student: updated.student ? { id: updated.student.id, name: updated.student.name } : null,
    },
  });
}
