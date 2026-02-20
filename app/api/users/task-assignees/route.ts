import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Danışman ve operasyon kullanıcılarını listele — görev atama için. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: "CONSULTANT" },
        { role: "OPERATION_UNIVERSITY" },
        { role: "OPERATION_ACCOMMODATION" },
        { role: "OPERATION_VISA" },
      ],
      id: { not: session.user.id },
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const roleLabels: Record<string, string> = {
    CONSULTANT: "Danışman",
    OPERATION_UNIVERSITY: "Üniversite Sorumlusu",
    OPERATION_ACCOMMODATION: "Konaklama & Dil Kursu",
    OPERATION_VISA: "Vize Sorumlusu",
  };

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name ?? u.email,
      email: u.email,
      role: u.role,
      roleLabel: roleLabels[u.role] ?? u.role,
    })),
  });
}
