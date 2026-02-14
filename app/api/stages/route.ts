import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stages = await prisma.stage.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, sortOrder: true },
  });
  return NextResponse.json(
    { stages },
    { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" } }
  );
}
