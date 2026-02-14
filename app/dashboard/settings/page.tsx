import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GmailConnectionCard } from "../GmailConnectionCard";
import { EditProfileForm } from "../EditProfileForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gmailConnection: { select: { status: true, lastSyncAt: true } } },
  });
  if (!student) redirect("/login");

  const conn = student.gmailConnection;
  const status = conn?.status ?? "disconnected";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Ayarlar
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
        Gmail bağlantını ve profil bilgilerini buradan yönetebilirsin.
      </p>

      <div className="mb-8">
        <GmailConnectionCard
          studentId={student.id}
          gmailAddress={student.gmailAddress}
          status={status}
          lastSyncAt={conn?.lastSyncAt ?? null}
          showInboxLink={status === "connected"}
        />
      </div>

      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Bilgileri düzenle
        </h2>
        <EditProfileForm
          studentId={student.id}
          initialName={student.name}
          initialStudentEmail={student.studentEmail}
        />
      </section>
    </div>
  );
}
