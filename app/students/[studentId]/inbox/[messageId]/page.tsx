import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PanelLayout } from "@/components/PanelLayout";
import { EmailDetailClient } from "./EmailDetailClient";

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ studentId: string; messageId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId, messageId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  const message = await prisma.emailMessage.findFirst({
    where: { studentId, gmailMessageId: messageId },
  });
  if (!message) notFound();

  const thread = await prisma.emailMessage.findMany({
    where: { studentId, threadId: message.threadId },
    orderBy: { internalDate: "asc" },
  });

  const [student, stages] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { name: true, gmailAddress: true, stage: true },
    }),
    prisma.stage.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!student) notFound();

  const subject = message.subject?.trim() || "(Konu yok)";

  return (
    <PanelLayout
      backHref={`/students/${studentId}/inbox`}
      backLabel="Gelen kutusuna dön"
      title={subject}
      subtitle="Mail detayı"
      sticky
    >
      <EmailDetailClient
        studentId={studentId}
        studentStage={student.stage}
        gmailAddress={student.gmailAddress ?? ""}
        message={message}
        thread={thread}
        stages={stages}
        canAddNotes={role !== "STUDENT"}
      />
    </PanelLayout>
  );
}
