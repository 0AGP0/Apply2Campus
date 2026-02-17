import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Kart artık ana sayfada; eski linki dashboard'a yönlendir. */
export default async function CrmFormPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  redirect("/dashboard");
}
