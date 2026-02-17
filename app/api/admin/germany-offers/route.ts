import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Admin: Katalog ürünlerini listele. country ile filtre. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const country = req.nextUrl.searchParams.get("country") ?? undefined;
  const city = req.nextUrl.searchParams.get("city") ?? undefined;
  const programGrup = req.nextUrl.searchParams.get("programGrup") ?? undefined;
  const search = req.nextUrl.searchParams.get("q")?.trim() ?? undefined;
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(25, parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10) || 50));
  const skip = (page - 1) * limit;

  const andParts: Record<string, unknown>[] = [];
  if (country) andParts.push({ country });
  if (city) andParts.push({ city });
  if (programGrup) andParts.push({ attributes: { path: ["programGrup"], equals: programGrup } });
  if (search) andParts.push({ OR: [{ schoolName: { contains: search, mode: "insensitive" } }, { program: { contains: search, mode: "insensitive" } }] });
  const where = andParts.length > 0 ? { AND: andParts } : {};

  let rows: Awaited<ReturnType<typeof prisma.catalogItem.findMany>>;
  let total: number;
  try {
    [rows, total] = await Promise.all([
      prisma.catalogItem.findMany({
        where,
        orderBy: [{ country: "asc" }, { city: "asc" }, { schoolName: "asc" }, { sortOrder: "asc" }],
        skip,
        take: limit,
      }),
      prisma.catalogItem.count({ where }),
    ]);
  } catch (err: unknown) {
    const msg = err && typeof (err as Error).message === "string" ? (err as Error).message : "";
    if (msg.includes("Unknown argument") && msg.includes("country")) {
      return NextResponse.json(
        { error: "Prisma client güncel değil. Dev server'ı durdurun, 'npx prisma generate' çalıştırın, sonra tekrar başlatın." },
        { status: 503 }
      );
    }
    throw err;
  }

  const [allCountries, allCities, allProgramGrups] = await Promise.all([
    prisma.catalogItem.findMany({ select: { country: true }, distinct: ["country"], orderBy: { country: "asc" } }),
    prisma.catalogItem.findMany({
      where: country ? { country } : undefined,
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.$queryRaw<{ programGrup: string }[]>`SELECT DISTINCT attributes->>'programGrup' as "programGrup" FROM "CatalogItem" WHERE attributes->>'programGrup' IS NOT NULL AND attributes->>'programGrup' != '' ORDER BY "programGrup"`.catch(() => []),
  ]);
  const countries = allCountries.map((r) => r.country);
  const cities = allCities.map((r) => r.city);
  const programGrups = allProgramGrups.map((r) => r.programGrup).filter(Boolean);
  const serialized = rows.map((r) => ({
    id: r.id,
    country: r.country,
    city: r.city,
    schoolName: r.schoolName,
    program: r.program,
    attributes: (r.attributes as Record<string, unknown>) ?? {},
    sortOrder: r.sortOrder,
  }));

  return NextResponse.json({
    rows: serialized,
    countries,
    cities,
    programGrups,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

/** Admin: Yeni katalog ürünü ekle. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { country, city, schoolName, program, attributes, sortOrder } = body;

  if (!country || !city || !schoolName || !program) {
    return NextResponse.json({ error: "Ülke, şehir, okul adı ve program gerekli" }, { status: 400 });
  }

  const attrs = attributes && typeof attributes === "object" ? attributes : {};

  const row = await prisma.catalogItem.create({
    data: {
      country: String(country).trim(),
      city: String(city).trim(),
      schoolName: String(schoolName).trim(),
      program: String(program).trim(),
      attributes: attrs,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    },
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
