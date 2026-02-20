import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StudentOverviewClient } from "./StudentOverviewClient";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  const [student, stages] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        gmailConnection: {
          select: {
            id: true,
            status: true,
            lastSyncAt: true,
            provider: true,
          },
        },
      },
    }),
    prisma.stage.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!student) notFound();

  return (
    <StudentOverviewClient
      student={{
        id: student.id,
        name: student.name,
        studentEmail: student.studentEmail,
        gmailAddress: student.gmailAddress,
        stage: student.stage,
        gmailConnection: student.gmailConnection,
      }}
      stages={stages}
    />
  );
}
