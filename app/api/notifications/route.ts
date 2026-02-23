import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Danışman/Operasyon/Admin bildirimleri: ConsultantNotification + UserNotification (duyuru vb.) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const allowed = role === "CONSULTANT" || role === "ADMIN" || isOperationRole(role);
  if (!allowed) return NextResponse.json({ notifications: [] });

  try {
    const [consultantList, userList] = await Promise.all([
      prisma.consultantNotification.findMany({
        where: { userId: session.user.id },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        take: 50,
        include: { student: { select: { id: true, name: true } } },
      }),
      prisma.userNotification.findMany({
        where: { userId: session.user.id },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        take: 50,
      }),
    ]);

    const consultantItems = consultantList.map((n) => ({
      id: n.id,
      kind: "consultant" as const,
      type: n.type,
      studentId: n.studentId,
      studentName: n.student.name,
      title: n.message ?? (n.type === "STUDENT_ASSIGNED" ? "Yeni öğrenci atandı" : "Öğrenci güncellendi"),
      message: n.message,
      linkHref: `/students/${n.studentId}`,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));

    const userItems = userList.map((n) => ({
      id: n.id,
      kind: "user" as const,
      type: n.type,
      studentId: null as string | null,
      studentName: null as string | null,
      title: n.title,
      message: n.message,
      linkHref: n.linkHref,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));

    const merged = [...consultantItems, ...userItems];
    merged.sort((a, b) => {
      const aRead = a.readAt ? 1 : 0;
      const bRead = b.readAt ? 1 : 0;
      if (aRead !== bRead) return aRead - bRead;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const notifications = merged.slice(0, 50);

    return NextResponse.json({ notifications });
  } catch (e) {
    console.error("[api/notifications GET]", e);
    return NextResponse.json({ notifications: [] });
  }
}
