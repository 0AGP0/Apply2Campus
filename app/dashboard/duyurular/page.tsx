import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AnnouncementsCard } from "@/components/AnnouncementsCard";

export default async function DashboardDuyurularPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if ((session.user as { role?: string }).role !== "STUDENT") redirect("/");

  return (
    <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Duyurular
      </h1>
      <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
        Etkinlikler ve duyurular.
      </p>
      <AnnouncementsCard />
    </div>
  );
}
