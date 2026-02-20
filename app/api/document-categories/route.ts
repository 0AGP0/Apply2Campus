import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const type = req.nextUrl.searchParams.get("type");
  const where = type === "OPERATION_UPLOADED" || type === "STUDENT_UPLOADED" ? { type: type as "OPERATION_UPLOADED" | "STUDENT_UPLOADED" } : undefined;

  const categories = await prisma.documentCategory.findMany({
    where,
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, name: true, type: true, sortOrder: true },
  });
  return NextResponse.json({ categories });
}
