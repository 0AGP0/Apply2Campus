import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BasvurularimClient } from "./BasvurularimClient";

export default async function BasvurularimPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Başvurularım</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Üniversite başvurularınız. Kabul belgesi yüklendiğinde ilgili başvuruda 2. taksit ödemesi görünecektir.
      </p>
      <BasvurularimClient studentId={studentId} />
    </div>
  );
}
