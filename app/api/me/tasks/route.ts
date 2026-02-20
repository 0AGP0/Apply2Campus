import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Bana atanan görevler (assignedTo = ben) ve benim atadığım görevler (assignedBy = ben). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const [assignedToMe, assignedByMe] = await Promise.all([
    prisma.task.findMany({
      where: { assignedToId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        assignedBy: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true } },
      },
    }),
    prisma.task.findMany({
      where: { assignedById: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        student: { select: { id: true, name: true } },
      },
    }),
  ]);

  const toDto = (t: { id: string; title: string; description: string | null; status: string; createdAt: Date; assignedBy?: { id: string; name: string | null; email: string } | null; assignedTo?: { id: string; name: string | null; email: string } | null; student?: { id: string; name: string } | null }) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    assignedBy: t.assignedBy ? { id: t.assignedBy.id, name: t.assignedBy.name ?? t.assignedBy.email } : null,
    assignedTo: t.assignedTo ? { id: t.assignedTo.id, name: t.assignedTo.name ?? t.assignedTo.email } : null,
    student: t.student ? { id: t.student.id, name: t.student.name } : null,
  });

  return NextResponse.json({
    assignedToMe: assignedToMe.map(toDto),
    assignedByMe: assignedByMe.map(toDto),
  });
}
