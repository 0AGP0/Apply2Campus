import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Kurum hizmeti için tarih aralığına göre fiyat bul. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!serviceId || !startDate || !endDate) {
    return NextResponse.json({ error: "serviceId, startDate, endDate gerekli" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Geçerli tarihler girin" }, { status: 400 });
  }

  const price = await prisma.institutionPrice.findFirst({
    where: {
      serviceId,
      startDate: { lte: start },
      endDate: { gte: end },
    },
    include: {
      service: { include: { institution: true } },
    },
  });

  if (!price) return NextResponse.json({ price: null });
  return NextResponse.json({
    price: {
      id: price.id,
      amount: Number(price.amount),
      currency: price.currency,
      startDate: price.startDate.toISOString().slice(0, 10),
      endDate: price.endDate.toISOString().slice(0, 10),
      serviceName: price.service.name,
      institutionName: price.service.institution.name,
    },
  });
}
