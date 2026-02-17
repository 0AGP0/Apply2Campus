import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Öğrenci panelinde inbox kaldırıldı; Gmail bağlantısı kalıyor, mailleri görüntüleme yok. Eski linkleri ana sayfaya yönlendir. */
export default async function StudentInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  redirect("/dashboard");
}
