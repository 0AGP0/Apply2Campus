import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PanelLayout } from "@/components/PanelLayout";
import { AnnouncementsCard } from "@/components/AnnouncementsCard";
import { isOperationRole } from "@/lib/roles";

export default async function PanelDuyurularPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const role = (session.user as { role?: string })?.role ?? "CONSULTANT";
  if (role === "ADMIN") redirect("/admin/duyurular");
  if (role === "STUDENT") redirect("/dashboard/duyurular");
  if (!isOperationRole(role) && role !== "CONSULTANT") redirect("/");

  return (
    <PanelLayout
      title="Duyurular"
      subtitle="Etkinlikler ve duyurular"
    >
      <div className="mt-6 max-w-2xl">
        <AnnouncementsCard />
      </div>
    </PanelLayout>
  );
}
