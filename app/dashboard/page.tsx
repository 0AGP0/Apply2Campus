import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GmailConnectionCard } from "./GmailConnectionCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { gmailConnection: { select: { status: true, lastSyncAt: true } } },
  });
  if (!student) redirect("/login");

  const status = student.gmailConnection?.status ?? "disconnected";

  if (status === "connected") {
    redirect("/dashboard/inbox");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto pt-4 sm:pt-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Gmail hesabını bağla
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-6">
          Danışmanınla maillerini tek yerden takip edebilmen için Gmail hesabını güvenli bir şekilde bağlaman gerekiyor. Bu sayede gelen kutundaki mailleri burada görebilir ve yanıtlayabilirsin.
        </p>

        {/* Öğretici: Ne yapacaksın */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5 mb-6">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 mb-3">
            <span className="material-icons-outlined text-primary text-lg">list_alt</span>
            Nasıl bağlanacaksın?
          </h2>
          <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">1</span>
              <span><strong className="text-slate-700 dark:text-slate-300">“Gmail ile Bağlan”</strong> butonuna tıkla.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">2</span>
              <span>Google hesabınla giriş yap (okul veya kişisel Gmail farketmez).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">3</span>
              <span>“Erişim ver” / “Allow” diyerek uygulamanın sadece <strong className="text-slate-700 dark:text-slate-300">mail okuma ve gönderme</strong> iznini onayla.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">4</span>
              <span>Yönlendirildikten sonra gelen kutusu burada açılacak; danışmanın da senin izin verdiğin mailleri görebilecek.</span>
            </li>
          </ol>
        </div>

        {/* Güvenlik notu */}
        <div className="flex gap-3 p-3 sm:p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 mb-8">
          <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400 text-xl shrink-0">verified_user</span>
          <div className="text-sm text-emerald-800 dark:text-emerald-200">
            <strong>Güvenlik:</strong> Bağlantı Google OAuth ile yapılır; şifreni burada kimse görmez. İstediğin zaman Ayarlar’dan bağlantıyı kaldırabilirsin.
          </div>
        </div>

        <GmailConnectionCard
          studentId={student.id}
          gmailAddress={student.gmailAddress}
          status={status}
          lastSyncAt={student.gmailConnection?.lastSyncAt ?? null}
        />
      </div>
    </div>
  );
}
