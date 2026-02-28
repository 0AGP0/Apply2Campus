import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StudentDetailLayoutClient } from "./StudentDetailLayoutClient";

export default async function StudentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  });
  if (!student) notFound();

  return (
    <StudentDetailLayoutClient studentId={studentId} studentName={student.name}>
      {children}
    </StudentDetailLayoutClient>
  );
}
