import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CatalogAttributes, DURATION_KEYS, getCurrency, getPriceForDuration, getProgramGrup } from "@/lib/catalog";

type SerializedRow = {
  id: string;
  country: string;
  city: string;
  schoolName: string;
  program: string;
  programGrup: string | null;
  attributes: CatalogAttributes;
  currency: string | null;
  priceByDuration: Record<string, number | null>;
};

type CatalogRow = {
  id: string;
  country: string;
  city: string;
  schoolName: string;
  program: string;
  attributes: unknown;
};

/** Katalog: danışman teklif formunda kullanır. city ile filtre. Ürün/attribute yapısı. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN" && role !== "CONSULTANT")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const country = req.nextUrl.searchParams.get("country") ?? undefined;
  const city = req.nextUrl.searchParams.get("city") ?? undefined;

  const rows = await prisma.catalogItem.findMany({
    where: {
      ...(country ? { country } : {}),
      ...(city ? { city } : {}),
    },
    orderBy: [{ country: "asc" }, { city: "asc" }, { schoolName: "asc" }, { sortOrder: "asc" }],
    take: 5000, // VPS: sınırsız dönüş engeli
  });

  const attrs = (r: { attributes: unknown }): CatalogAttributes =>
    (r.attributes as CatalogAttributes | null) ?? {};

  const serialized: SerializedRow[] = rows.map((r: CatalogRow) => {
    const a = attrs(r);
    const priceByDuration: Record<string, number | null> = {};
    for (const key of DURATION_KEYS) {
      priceByDuration[key] = getPriceForDuration(a, Number(key));
    }
    return {
      id: r.id,
      country: r.country,
      city: r.city,
      schoolName: r.schoolName,
      program: r.program,
      programGrup: getProgramGrup(a),
      attributes: a,
      currency: getCurrency(a),
      priceByDuration,
    };
  });

  const byCity = serialized.reduce<Record<string, SerializedRow[]>>((acc, row) => {
    if (!acc[row.city]) acc[row.city] = [];
    acc[row.city].push(row);
    return acc;
  }, {});

  const countries = Array.from(new Set(serialized.map((r) => r.country))).sort();
  const byCountry: Record<string, { cities: string[]; byCity: Record<string, SerializedRow[]> }> = {};
  for (const row of serialized) {
    if (!byCountry[row.country]) {
      byCountry[row.country] = { cities: [], byCity: {} };
    }
    if (!byCountry[row.country].byCity[row.city]) {
      byCountry[row.country].byCity[row.city] = [];
      byCountry[row.country].cities.push(row.city);
    }
    byCountry[row.country].byCity[row.city].push(row);
  }
  for (const c of Object.keys(byCountry)) {
    byCountry[c].cities.sort();
  }

  return NextResponse.json({
    rows: serialized,
    countries,
    cities: Array.from(new Set(rows.map((r: CatalogRow) => r.city))).sort(),
    byCity,
    byCountry,
    durationKeys: DURATION_KEYS,
  });
}
