import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Öğrencinin kendi teklifleri. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const studentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || !studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const list = await prisma.offer.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    offers: list.map((o) => ({
      id: o.id,
      title: o.title,
      summary: o.summary,
      status: o.status,
      sentAt: o.sentAt,
      viewedAt: o.viewedAt,
      respondedAt: o.respondedAt,
      createdAt: o.createdAt,
      createdBy: o.createdBy,
      itemCount: o.items.length,
      totalAmount: o.items.reduce((s, i) => s + Number(i.amount), 0),
    })),
  });
}
