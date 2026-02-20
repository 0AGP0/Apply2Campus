import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isOperationRole } from "@/lib/roles";
import { PanelLayout } from "@/components/PanelLayout";
import { TasksClient } from "./TasksClient";

export default async function GorevlerPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userId = (user as { id?: string })?.id ?? "";
  const role = (user as { role?: string })?.role ?? "";

  if (!userId) redirect("/login");
  if (role === "STUDENT" || role === "ADMIN") redirect("/");

  return (
    <PanelLayout
      title="Görevler"
      subtitle="Danışman ve operasyon ekibi birbirine görev atayabilir; atanan görevlerinizi buradan takip edin."
    >
      <TasksClient />
    </PanelLayout>
  );
}
