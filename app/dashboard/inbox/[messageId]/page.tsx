import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Öğrenci panelinde mail görüntüleme kaldırıldı. Eski linkleri ana sayfaya yönlendir. */
export default async function StudentEmailDetailPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  redirect("/dashboard");
}
