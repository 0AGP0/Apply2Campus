import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DURATION_KEYS, CURRENCY_KEY } from "@/lib/catalog";

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === delimiter) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseNum(val: string): number | null {
  if (val == null || val === "") return null;
  const s = val.replace(",", ".").trim();
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

/** Admin: CSV ile katalog içe aktar. Body = CSV metni (ilk satır başlık). */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const defaultCountry = req.nextUrl.searchParams.get("defaultCountry") ?? undefined;
  const raw = await req.text();
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV en az başlık + 1 veri satırı içermeli" }, { status: 400 });
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
  const headerRow = parseCsvLine(lines[0], delimiter);
  const headerIndex: Record<string, number> = {};
  headerRow.forEach((h, i) => {
    const key = h.trim();
    if (key) headerIndex[key] = i;
  });

  const get = (row: string[], key: string): string => {
    const i = headerIndex[key];
    return i !== undefined ? (row[i] ?? "").trim() : "";
  };

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let idx = 1; idx < lines.length; idx++) {
    const row = parseCsvLine(lines[idx], delimiter);
    let country = get(row, "Ulke");
    if (!country && defaultCountry) country = defaultCountry;
    const city = get(row, "Sehir");
    const okulAdi = get(row, "Okul_Adi");
    const programAdi = get(row, "Program_Adi");
    const program = get(row, "Program");
    const programName = (programAdi || program || "").trim() || (program || programAdi || "").trim();
    if (!country || !city || !okulAdi || !programName) {
      errors.push(`Satır ${idx + 1}: Ülke, şehir, okul adı ve program dolu olmalı`);
      continue;
    }

    const attributes: Record<string, unknown> = {};
    for (const key of DURATION_KEYS) {
      const col = `${key}_Hafta`;
      const val = get(row, col);
      const num = parseNum(val);
      if (num !== null) attributes[key] = num;
    }
    const paraBirimi = get(row, "Para_Birimi");
    if (paraBirimi) attributes[CURRENCY_KEY] = paraBirimi;
    const programGrup = get(row, "Program_Grup");
    if (programGrup) attributes["programGrup"] = programGrup;

    const existing = await prisma.catalogItem.findFirst({
      where: { country, city, schoolName: okulAdi, program: programName },
    });

    if (existing) {
      await prisma.catalogItem.update({
        where: { id: existing.id },
        data: { attributes: attributes as Prisma.InputJsonValue },
      });
      updated++;
    } else {
      await prisma.catalogItem.create({
        data: {
          country,
          city,
          schoolName: okulAdi,
          program: programName,
          attributes: attributes as Prisma.InputJsonValue,
          sortOrder: 0,
        },
      });
      created++;
    }
  }

  return NextResponse.json({
    ok: true,
    created,
    updated,
    total: created + updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}
