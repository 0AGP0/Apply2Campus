import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Öğrencinin bildirimleri (duyuru, teklif vb.) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  const studentId = (session.user as { studentId?: string }).studentId;

  if (role !== "STUDENT" || !studentId) {
    return NextResponse.json({ notifications: [] });
  }

  try {
    const list = await prisma.userNotification.findMany({
      where: { userId: session.user.id },
      orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({
      notifications: list.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        linkHref: n.linkHref,
        relatedId: n.relatedId,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[api/me/notifications GET]", e);
    return NextResponse.json({ notifications: [] });
  }
}
