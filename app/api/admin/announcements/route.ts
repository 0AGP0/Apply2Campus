import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyAnnouncementToAll } from "@/lib/notifications";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.announcement.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    announcements: items.map((a) => ({
      ...a,
      startDate: a.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: a.endDate?.toISOString().slice(0, 10) ?? null,
      createdAt: a.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = body.type === "ETKINLIK" ? "ETKINLIK" : "DUYURU";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Başlık gerekli" }, { status: 400 });

    const bodyText = typeof body.body === "string" ? body.body.trim() || null : null;
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const targetAudience = ["STUDENTS", "CONSULTANTS", "ALL"].includes(body.targetAudience)
      ? body.targetAudience
      : "ALL";

    const a = await prisma.announcement.create({
      data: {
        type,
        title,
        body: bodyText,
        startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
        endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
        targetAudience,
      },
    });

    notifyAnnouncementToAll(a.id, title, type, targetAudience).catch((err) =>
      console.error("[api/admin/announcements] notifyAnnouncementToAll", err)
    );

    return NextResponse.json({
      announcement: {
        ...a,
        startDate: a.startDate?.toISOString().slice(0, 10) ?? null,
        endDate: a.endDate?.toISOString().slice(0, 10) ?? null,
        createdAt: a.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Veritabanı hatası";
    console.error("[api/admin/announcements POST]", e);
    return NextResponse.json({ error: `Duyuru eklenemedi: ${msg}` }, { status: 500 });
  }
}
