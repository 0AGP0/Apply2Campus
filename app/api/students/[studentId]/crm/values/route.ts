import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

/** Body: { values: [{ fieldSlug: string, value: string }] } - checkbox için "true"/"false" */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const items = Array.isArray(body.values) ? body.values : [];
  if (items.length === 0) return NextResponse.json({ error: "values array required" }, { status: 400 });

  const slugs = Array.from(new Set(items.map((i: { fieldSlug?: string }) => i.fieldSlug).filter(Boolean))) as string[];
  const fields = await prisma.crmField.findMany({
    where: { slug: { in: slugs }, type: { not: "FILE" } },
    select: { id: true, slug: true },
  });
  const fieldBySlug = Object.fromEntries(fields.map((f) => [f.slug, f.id]));

  for (const item of items) {
    const fieldId = fieldBySlug[item.fieldSlug];
    if (!fieldId || item.value == null) continue;
    const value = String(item.value).slice(0, 10000);
    await prisma.crmValue.upsert({
      where: {
        studentId_crmFieldId: { studentId, crmFieldId: fieldId },
      },
      update: { value },
      create: { studentId, crmFieldId: fieldId, value },
    });
  }

  return NextResponse.json({ ok: true });
}
