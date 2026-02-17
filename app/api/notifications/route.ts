import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Danışmanın kendi bildirimleri (okunmamış önce, sonra okunmuş). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "CONSULTANT" && role !== "ADMIN") return NextResponse.json({ notifications: [] });

  const list = await prisma.consultantNotification.findMany({
    where: { userId: session.user.id },
    orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    notifications: list.map((n) => ({
      id: n.id,
      type: n.type,
      studentId: n.studentId,
      studentName: n.student.name,
      message: n.message,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
  });
}
