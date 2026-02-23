import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: { type?: string; title?: string; body?: string | null; startDate?: Date | null; endDate?: Date | null; active?: boolean; targetAudience?: string } = {};

  if (body.type !== undefined) data.type = body.type === "ETKINLIK" ? "ETKINLIK" : "DUYURU";
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.body !== undefined) data.body = body.body ? String(body.body).trim() : null;
  if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.active !== undefined) data.active = !!body.active;
  if (["STUDENTS", "CONSULTANTS", "ALL"].includes(body.targetAudience)) data.targetAudience = body.targetAudience;

  const updated = await prisma.announcement.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    announcement: {
      ...updated,
      startDate: updated.startDate?.toISOString().slice(0, 10) ?? null,
      endDate: updated.endDate?.toISOString().slice(0, 10) ?? null,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const a = await prisma.announcement.findUnique({ where: { id } });
  if (!a) return NextResponse.json({ error: "Duyuru bulunamadı" }, { status: 404 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
