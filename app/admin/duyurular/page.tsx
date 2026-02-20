import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PanelLayout } from "@/components/PanelLayout";
import { AdminDuyurularClient } from "./AdminDuyurularClient";

export default async function AdminDuyurularPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/");

  return (
    <PanelLayout
      title="Etkinlikler & Duyurular"
      subtitle="Öğrenci paneli ana sayfasında görünen duyuruları ve etkinlikleri yönetin."
    >
      <AdminDuyurularClient />
    </PanelLayout>
  );
}
