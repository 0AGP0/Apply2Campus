import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type SectionRow = { id: string; slug: string; name: string; sortOrder: number; fields: { id: string; slug: string; label: string; type: string; required: boolean; options: unknown; allowMultiple: boolean }[] };

/** Form için bölümler ve alanlar (sıralı). Öğrenci/danışman girişi gerekir. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sections = await (prisma as unknown as { crmSection: { findMany: (args: unknown) => Promise<SectionRow[]> } }).crmSection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      fields: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          slug: true,
          label: true,
          type: true,
          required: true,
          options: true,
          allowMultiple: true,
        },
      },
    },
  });

  return NextResponse.json({
    sections: sections.map((s: SectionRow) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      sortOrder: s.sortOrder,
      fields: s.fields,
    })),
  });
}
