import { getServerSession, authOptions } from "@/lib/auth";
import { StudentListClient } from "./StudentListClient";
import { PanelLayout } from "@/components/PanelLayout";
import { isOperationRole } from "@/lib/roles";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "CONSULTANT";
  const isAdmin = role === "ADMIN";
  const isOperationUser = isOperationRole(role);

  return (
    <PanelLayout
      title="Öğrenci listesi"
      subtitle="Kurumunuzdaki öğrencileri yönetin. Filtrelerle arama yapıp detay için satıra tıklayın."
      actions={
        isAdmin ? (
          <a
            href="/admin"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary border-2 border-primary/40 hover:bg-primary/10 hover:border-primary/60 transition-all w-full sm:w-auto"
          >
            <span className="material-icons-outlined text-lg">dashboard</span>
            Admin paneli
          </a>
        ) : isOperationUser ? (
          <a
            href="/operasyon/inbox"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary border-2 border-primary/40 hover:bg-primary/10 hover:border-primary/60 transition-all w-full sm:w-auto"
          >
            <span className="material-icons-outlined text-lg">inbox</span>
            Tek Inbox
          </a>
        ) : null
      }
    >
      <div className="mt-4 sm:mt-6">
        <StudentListClient isAdmin={isAdmin} />
      </div>
    </PanelLayout>
  );
}
