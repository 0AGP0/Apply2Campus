import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentOffersListClient } from "./StudentOffersListClient";

export default async function DashboardOffersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Teklifler</h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Aktif teklifleri görüntüleyip yanıtlayabilir, geçmiş tekliflere göz atabilirsiniz.</p>
      <StudentOffersListClient />
    </div>
  );
}
