import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { StudentDetailClient } from "./StudentDetailClient";
import { PageHeader } from "@/components/PageHeader";

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
    <>
      <PageHeader
        backHref="/students"
        backLabel="Öğrenci listesine dön"
        title={student.name}
        subtitle="Danışman paneli"
        sticky
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6 overflow-x-auto">
          <Link href="/students" className="hover:text-primary transition-colors shrink-0">
            Öğrenciler
          </Link>
          <span className="material-icons-outlined text-xs shrink-0">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium truncate">
            {student.name}
          </span>
        </nav>

        <StudentDetailClient
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
      </main>
    </>
  );
}
