import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceId } = await params;
  const service = await prisma.institutionService.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const startDate = body.startDate ? new Date(body.startDate) : null;
  const endDate = body.endDate ? new Date(body.endDate) : null;
  const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount);
  const currency = typeof body.currency === "string" ? body.currency.trim() || "EUR" : "EUR";

  if (!startDate || isNaN(startDate.getTime())) return NextResponse.json({ error: "Başlangıç tarihi gerekli" }, { status: 400 });
  if (!endDate || isNaN(endDate.getTime())) return NextResponse.json({ error: "Bitiş tarihi gerekli" }, { status: 400 });
  if (isNaN(amount) || amount < 0) return NextResponse.json({ error: "Geçerli tutar girin" }, { status: 400 });

  const price = await prisma.institutionPrice.create({
    data: { serviceId, startDate, endDate, amount, currency },
  });
  return NextResponse.json({
    price: {
      ...price,
      amount: Number(price.amount),
      startDate: price.startDate.toISOString().slice(0, 10),
      endDate: price.endDate.toISOString().slice(0, 10),
    },
  });
}
