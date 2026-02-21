import { getServerSession, authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";
import { PanelLayout } from "@/components/PanelLayout";
import { OperasyonMessageClient } from "./OperasyonMessageClient";

export default async function OperasyonMessagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (!isOperationRole((session.user as { role?: string }).role)) redirect("/operasyon/inbox");

  const { id } = await params;
  const message = await prisma.emailMessage.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true } },
      emailMessageBadges: { include: { badge: { select: { id: true, name: true, color: true } } } },
    },
  });
  if (!message) notFound();

  const thread = await prisma.emailMessage.findMany({
    where: { threadId: message.threadId, studentId: message.studentId },
    orderBy: { internalDate: "asc" },
  });

  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const subject = message.subject?.trim() || "(Konu yok)";

  return (
    <PanelLayout
      backHref="/operasyon/inbox"
      backLabel="Inbox'a dön"
      title={subject}
      subtitle="Mail detayı"
      sticky
    >
      <OperasyonMessageClient
        messageId={message.id}
        message={message}
        thread={thread}
        students={students}
      />
    </PanelLayout>
  );
}
