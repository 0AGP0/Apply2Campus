import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalStudents, totalEmails, connectedCount, expiredCount, auditCount] =
    await Promise.all([
      prisma.student.count(),
      prisma.emailMessage.count(),
      prisma.gmailConnection.count({ where: { status: "connected" } }),
      prisma.gmailConnection.count({ where: { status: "expired" } }),
      prisma.auditLog.count(),
    ]);

  return NextResponse.json({
    totalStudents,
    totalEmails,
    connectedGmail: connectedCount,
    expiredGmail: expiredCount,
    auditLogCount: auditCount,
  });
}
