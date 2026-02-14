import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const badges = await prisma.badge.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ badges }, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role === "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, color } = body;
  if (!name || typeof name !== "string" || !name.trim())
    return NextResponse.json({ error: "Name required" }, { status: 400 });

  const badge = await prisma.badge.create({
    data: {
      name: name.trim(),
      color: typeof color === "string" ? color.trim() || undefined : undefined,
    },
  });
  return NextResponse.json(badge, { status: 201 });
}
