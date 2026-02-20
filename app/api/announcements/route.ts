import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Etkinlikler ve duyurular — öğrenci paneli genel bakış. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  const allowed = role === "STUDENT" || role === "CONSULTANT" || role === "ADMIN" || ["OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"].includes(role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const items = await prisma.announcement.findMany({
    where: {
      active: true,
      OR: [{ endDate: null }, { endDate: { gte: today } }],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 20,
  });

  return NextResponse.json({
    announcements: items.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      body: a.body,
      startDate: a.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: a.endDate?.toISOString().slice(0, 10) ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}
