import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OperasyonInboxClient } from "./OperasyonInboxClient";
import { PanelLayout } from "@/components/PanelLayout";

export default async function OperasyonInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "";
  const allowed = ["OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"].includes(role);
  if (!allowed) redirect("/students");

  return (
    <PanelLayout
      title="Tek Inbox"
      subtitle="Tüm öğrenci e-postaları tek listede"
    >
      <OperasyonInboxClient />
    </PanelLayout>
  );
}
