import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const stages = await prisma.stage.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const counts = await prisma.student.groupBy({
    by: ["stage"],
    _count: { id: true },
  });
  const countBySlug = Object.fromEntries(counts.map((c) => [c.stage, c._count.id]));

  return NextResponse.json({
    stages: stages.map((s) => ({ ...s, studentCount: countBySlug[s.slug] ?? 0 })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { slug, name } = body;
  const slugStr = typeof slug === "string" ? slug.trim().toLowerCase().replace(/\s+/g, "-") : "";
  const nameStr = typeof name === "string" ? name.trim() : "";
  if (!slugStr || !nameStr) return NextResponse.json({ error: "slug ve name gerekli" }, { status: 400 });

  const existing = await prisma.stage.findUnique({ where: { slug: slugStr } });
  if (existing) return NextResponse.json({ error: "Bu slug zaten var" }, { status: 409 });

  const maxOrder = await prisma.stage.aggregate({ _max: { sortOrder: true } });
  const stage = await prisma.stage.create({
    data: {
      slug: slugStr,
      name: nameStr,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(stage, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const nameStr = typeof body.name === "string" ? body.name.trim() : "";
  if (!slug) return NextResponse.json({ error: "slug gerekli" }, { status: 400 });
  if (!nameStr) return NextResponse.json({ error: "name gerekli" }, { status: 400 });

  const stage = await prisma.stage.findUnique({ where: { slug } });
  if (!stage) return NextResponse.json({ error: "Aşama bulunamadı" }, { status: 404 });

  const updated = await prisma.stage.update({
    where: { slug },
    data: { name: nameStr },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "slug gerekli" }, { status: 400 });

  const stage = await prisma.stage.findUnique({ where: { slug } });
  if (!stage) return NextResponse.json({ error: "Aşama bulunamadı" }, { status: 404 });

  const stages = await prisma.stage.findMany({ orderBy: { sortOrder: "asc" } });
  if (stages.length <= 1) return NextResponse.json({ error: "Son aşama silinemez" }, { status: 400 });

  const fallback = stages.find((s) => s.slug !== slug);
  const fallbackSlug = fallback?.slug ?? "lead";

  await prisma.$transaction([
    prisma.student.updateMany({ where: { stage: slug }, data: { stage: fallbackSlug } }),
    prisma.stage.delete({ where: { slug } }),
  ]);

  return NextResponse.json({ ok: true, migratedTo: fallbackSlug });
}
