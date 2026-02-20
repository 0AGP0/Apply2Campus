import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isOperationRole } from "@/lib/roles";
import { PanelLayout } from "@/components/PanelLayout";
import { SlotManagementClient } from "./SlotManagementClient";

export default async function MusaitSaatlerPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userId = (user as { id?: string })?.id ?? "";
  const role = (user as { role?: string })?.role ?? "CONSULTANT";

  if (!userId) redirect("/login");
  if (isOperationRole(role)) redirect("/panel");
  if (role !== "CONSULTANT" && role !== "ADMIN") redirect("/panel");

  return (
    <PanelLayout
      title="Müsait saatler"
      subtitle="Görüşme slotlarınızı ekleyin; öğrenciler bu slotlardan seçerek randevu talebi oluşturabilir."
    >
      <SlotManagementClient consultantId={userId} />
    </PanelLayout>
  );
}
