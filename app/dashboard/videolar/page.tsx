import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { VideolarClient } from "./VideolarClient";

export default async function VideolarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Eğitim Videoları</h1>
      <VideolarClient />
    </div>
  );
}
