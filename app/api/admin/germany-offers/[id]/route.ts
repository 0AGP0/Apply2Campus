import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Admin: Katalog ürünü güncelle. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: Prisma.CatalogItemUpdateInput = {};
  if (body.country !== undefined) data.country = String(body.country).trim();
  if (body.city !== undefined) data.city = String(body.city).trim();
  if (body.schoolName !== undefined) data.schoolName = String(body.schoolName).trim();
  if (body.program !== undefined) data.program = String(body.program).trim();
  if (body.attributes !== undefined && typeof body.attributes === "object" && body.attributes !== null)
    data.attributes = body.attributes as Prisma.InputJsonValue;
  if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;

  const row = await prisma.catalogItem.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    id: row.id,
    country: row.country,
    city: row.city,
    schoolName: row.schoolName,
    program: row.program,
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    sortOrder: row.sortOrder,
  });
}

/** Admin: Katalog ürünü sil. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.catalogItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
