import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Öğrencinin kendi başvuruları (Başvurularım sayfası). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const studentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || !studentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const applications = await prisma.studentApplication.findMany({
    where: { studentId },
    orderBy: { applicationDate: "desc" },
    include: {
      acceptanceDocument: {
        select: { id: true, fileName: true, status: true, uploadedAt: true },
      },
    },
  });

  return NextResponse.json({
    applications: applications.map((a) => ({
      ...a,
      secondInstallmentAmount: a.secondInstallmentAmount != null ? Number(a.secondInstallmentAmount) : null,
      applicationDate: a.applicationDate?.toISOString() ?? null,
      secondInstallmentDueDate: a.secondInstallmentDueDate?.toISOString() ?? null,
    })),
  });
}
