import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PanelLayout } from "@/components/PanelLayout";
import { AdminKurumlarClient } from "./AdminKurumlarClient";

export default async function AdminKurumlarPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if ((session.user as { role?: string }).role !== "ADMIN") redirect("/");

  return (
    <PanelLayout
      title="Kurum Kartları"
      subtitle="Teklif verirken kurum + hizmet + başlangıç/bitiş tarihi ile fiyat seçilebilir."
    >
      <AdminKurumlarClient />
    </PanelLayout>
  );
}
