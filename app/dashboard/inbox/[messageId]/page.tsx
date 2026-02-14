import { getServerSession, authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function StudentEmailDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  const { messageId } = await params;
  const message = await prisma.emailMessage.findFirst({
    where: { studentId, gmailMessageId: messageId },
  });
  if (!message) notFound();

  const thread = await prisma.emailMessage.findMany({
    where: { studentId, threadId: message.threadId },
    orderBy: { internalDate: "asc" },
  });

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/dashboard/inbox"
          className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span className="material-icons-outlined">arrow_back</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate flex-1">
          {message.subject ?? "(Konu yok)"}
        </h1>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {thread.map((m) => (
            <div key={m.id} className="p-6">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{m.from ?? "—"}</p>
                  <p className="text-sm text-slate-500">Kime: {m.to ?? "—"}</p>
                </div>
                <p className="text-sm text-slate-500 shrink-0">
                  {m.internalDate ? new Date(m.internalDate).toLocaleString() : ""}
                </p>
              </div>
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm"
                dangerouslySetInnerHTML={{
                  __html: m.bodyHtml ?? `<p>${m.snippet ?? ""}</p>`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
