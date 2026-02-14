import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { StudentDashboardLayout } from "./StudentDashboardLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "STUDENT") redirect("/");

  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gmailConnection: { select: { status: true, lastSyncAt: true } } },
  });
  if (!student) redirect("/login");

  return (
    <StudentDashboardLayout
      user={{ name: session.user.name, email: session.user.email }}
      student={student}
    >
      {children}
    </StudentDashboardLayout>
  );
}
