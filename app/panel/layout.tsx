import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { isOperationRole } from "@/lib/roles";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const role = (session.user as { role?: string })?.role ?? "CONSULTANT";
  if (role === "ADMIN") redirect("/admin");
  if (role === "STUDENT") redirect("/dashboard");
  if (!isOperationRole(role) && role !== "CONSULTANT") redirect("/");
  return (
    <AppLayout
      user={
        session.user as {
          name?: string | null;
          email?: string | null;
          image?: string | null;
          role?: string;
        }
      }
    >
      {children}
    </AppLayout>
  );
}
