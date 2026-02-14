import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";

export default async function StudentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return (
    <AppLayout user={session.user as { name?: string | null; email?: string | null; image?: string | null; role?: string }}>
      {children}
    </AppLayout>
  );
}
