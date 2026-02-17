import { getServerSession, authOptions } from "@/lib/auth";
import { StudentListClient } from "./StudentListClient";
import { PageHeader } from "@/components/PageHeader";
import { InfoCard } from "@/components/InfoCard";
import { ConsultantNotifications } from "@/components/ConsultantNotifications";

export default async function StudentsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "CONSULTANT";
  const isAdmin = role === "ADMIN";

  return (
    <div className="panel-page">
      <PageHeader
        title="Öğrenci listesi"
        subtitle="Kurumunuzdaki öğrencileri yönetin"
        actions={
          isAdmin ? (
            <a
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-semibold text-primary border-2 border-primary/40 hover:bg-primary/10 hover:border-primary/60 hover:shadow-md hover:shadow-primary/10 transition-all w-full sm:w-auto touch-manipulation"
            >
              <span className="material-icons-outlined text-lg">dashboard</span>
              Admin paneli
            </a>
          ) : (
            <ConsultantNotifications />
          )
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 mb-4 sm:mb-6">
        <InfoCard variant="info" title="Bu sayfa ne işe yarar?" icon="inbox">
          Öğrencilerin Gmail hesaplarını bağlamalarından sonra gelen kutuları buradan takip edebilirsiniz. Bir öğrenciye tıklayarak detay sayfasına gidin; oradan <strong>Gelen kutusu</strong> sekmesiyle maillerini görüntüleyebilir ve yanıtlayabilirsiniz.
        </InfoCard>
        <InfoCard variant="tip" title="Hızlı ipuçları" icon="lightbulb">
          <strong>Aşama</strong> ve <strong>Gmail durumu</strong> filtreleriyle listeyi daraltabilirsiniz. Gmail “Bağlı değil” olan öğrenciler henüz mail bağlamamıştır; onlara bağlantı adımını hatırlatabilirsiniz. Aşamayı değiştirmek için öğrenci detay sayfasındaki aşama açılır menüsünü kullanın.
        </InfoCard>
      </div>

      <div className="mt-4 sm:mt-8">
        <StudentListClient isAdmin={isAdmin} />
      </div>
    </div>
  );
}
