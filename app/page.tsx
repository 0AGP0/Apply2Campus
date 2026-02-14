import { redirect } from "next/navigation";
import { getServerSession, authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role === "ADMIN") redirect("/admin");
  if (role === "STUDENT") redirect("/dashboard");
  redirect("/students");
}
