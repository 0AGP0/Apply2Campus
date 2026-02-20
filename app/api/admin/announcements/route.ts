import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

  const a = await prisma.announcement.create({
    data: {
      type,
      title,
      body: bodyText,
      startDate: startDate && !isNaN(startDate.getTime()) ? startDate : null,
      endDate: endDate && !isNaN(endDate.getTime()) ? endDate : null,
    },
  });

  return NextResponse.json({
    announcement: {
      ...a,
      startDate: a.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: a.endDate?.toISOString().slice(0, 10) ?? null,
      createdAt: a.createdAt.toISOString(),
    },
  });
}
