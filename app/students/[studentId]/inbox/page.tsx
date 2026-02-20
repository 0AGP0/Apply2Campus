import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { InboxClient } from "./InboxClient";

export default async function InboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ label?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId } = await params;
  const { label } = await searchParams;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  const [student, folders, badges, stages] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        gmailConnection: { select: { status: true, lastSyncAt: true } },
      },
    }),
    prisma.folder.findMany({
      where: { studentId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, fromAddress: true },
    }),
    prisma.badge.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.stage.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!student) notFound();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <InboxClient
        studentId={studentId}
        studentName={student.name}
        studentStage={student.stage}
        gmailAddress={student.gmailAddress ?? ""}
        connectionStatus={student.gmailConnection?.status ?? "disconnected"}
        initialLabel={label ?? "INBOX"}
        user={{ name: session.user.name ?? null, email: session.user.email ?? null }}
        initialFolders={folders}
        initialBadges={badges}
        initialStages={stages}
      />
    </div>
  );
}
