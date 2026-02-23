import { getServerSession, authOptions } from "@/lib/auth";
import { getStudentsForUser } from "@/lib/rbac";
import { PanelLayout } from "@/components/PanelLayout";
import { InfoCard } from "@/components/InfoCard";
import { AnnouncementsCard } from "@/components/AnnouncementsCard";
import { isOperationRole } from "@/lib/roles";
import Link from "next/link";

export default async function PanelPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const userId = (user as { id?: string })?.id ?? "";
  const role = (user as { role?: string })?.role ?? "CONSULTANT";
  const studentId = (user as { studentId?: string | null })?.studentId ?? null;
  const isOperation = isOperationRole(role);

  const students = await getStudentsForUser(userId, role, studentId);
  const totalStudents = students.length;
  const withGmail = students.filter((s) => s.gmailConnection?.status === "connected").length;

  return (
    <PanelLayout
      title="Ana Sayfa"
      subtitle="Kurumunuzun özeti ve hızlı erişim"
      actions={
        isOperation ? (
          <Link
            href="/operasyon/inbox"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary border-2 border-primary/40 hover:bg-primary/10 hover:border-primary/60 transition-all w-full sm:w-auto"
          >
            <span className="material-icons-outlined text-lg">inbox</span>
            Tek Inbox
          </Link>
        ) : null
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-icons-outlined text-primary text-2xl">people_alt</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalStudents}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Toplam öğrenci</p>
            </div>
          </div>
          <Link
            href="/students"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Öğrenci listesine git
            <span className="material-icons-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400 text-2xl">mark_email_read</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{withGmail}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Gmail bağlı</p>
            </div>
          </div>
        </div>
        {isOperation && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-icons-outlined text-blue-600 dark:text-blue-400 text-2xl">inbox</span>
              </div>
              <div>
                <Link
                  href="/operasyon/inbox"
                  className="text-lg font-semibold text-slate-800 dark:text-white hover:text-primary transition-colors"
                >
                  Tek Inbox
                </Link>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tüm öğrenci mailleri</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4 mb-6">
        <div className="md:col-span-2">
          <AnnouncementsCard />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 mb-6">
        <InfoCard variant="info" title="Bu panel ne işe yarar?" icon="inbox">
          Öğrencilerin Gmail hesaplarını bağlamalarından sonra gelen kutuları <strong>Öğrenci listesi</strong> üzerinden takip edebilirsiniz. Bir öğrenciye tıklayarak detay sayfasına gidin; oradan <strong>Gelen kutusu</strong> sekmesiyle maillerini görüntüleyebilir ve yanıtlayabilirsiniz.
        </InfoCard>
        <InfoCard variant="tip" title="Hızlı ipuçları" icon="lightbulb">
          <strong>Aşama</strong> ve <strong>Gmail durumu</strong> filtreleriyle listeyi daraltabilirsiniz. Gmail &quot;Bağlı değil&quot; olan öğrenciler henüz mail bağlamamıştır; onlara bağlantı adımını hatırlatabilirsiniz.
        </InfoCard>
      </div>
    </PanelLayout>
  );
}
