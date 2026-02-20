import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: institutionId } = await params;
  const institution = await prisma.institution.findUnique({ where: { id: institutionId } });
  if (!institution) return NextResponse.json({ error: "Kurum bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const group = ["EDUCATION", "ACCOMMODATION", "OTHER"].includes(body.group) ? body.group : "EDUCATION";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Hizmet adı gerekli" }, { status: 400 });

  const service = await prisma.institutionService.create({
    data: { institutionId, group, name },
  });
  return NextResponse.json({ service });
}
