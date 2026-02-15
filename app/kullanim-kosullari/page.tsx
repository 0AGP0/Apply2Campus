import Link from "next/link";

export const metadata = {
  title: "Kullanım Koşulları | Apply2Campus",
  description: "Apply2Campus kullanım koşulları.",
};

export default function KullanimKosullariPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            Apply2Campus
          </Link>
          <Link
            href="/login"
            className="text-sm text-slate-600 dark:text-slate-400 hover:underline"
          >
            Giriş
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 prose prose-slate dark:prose-invert">
        <h1>Kullanım Koşulları</h1>
        <p className="text-sm text-slate-500">Son güncelleme: Şubat 2026</p>

        <h2>1. Hizmetin Kapsamı</h2>
        <p>
          Apply2Campus, öğrenci-danışman iletişimini ve e-posta yönetimini destekleyen bir
          platformdur. Hizmeti kullanarak bu koşulları kabul etmiş sayılırsınız.
        </p>

        <h2>2. Kullanıcı Sorumlulukları</h2>
        <p>
          Hesabınızı ve Gmail bağlantınızı yetkisiz kullanıma karşı korumak sizin
          sorumluluğunuzdadır. Platformu yalnızca yasal ve uygun amaçlarla kullanmalısınız.
        </p>

        <h2>3. Gmail Bağlantısı</h2>
        <p>
          Gmail bağlantısı isteğe bağlıdır. Bağladığınızda, platformun e-postalarınızı
          okuma ve (sizin adınıza) yanıt gönderme izni verdiğinizi kabul edersiniz. Bu
          erişimi istediğiniz zaman kaldırabilirsiniz.
        </p>

        <h2>4. Fikri Mülkiyet</h2>
        <p>
          Apply2Campus yazılımı ve markası hizmet sağlayıcıya aittir. İzinsiz kopyalama
          veya ticari kullanım yasaktır.
        </p>

        <h2>5. Değişiklikler</h2>
        <p>
          Bu koşullar ve gizlilik politikası güncellenebilir. Önemli değişiklikler
          uygulama veya e-posta ile duyurulabilir.
        </p>

        <h2>6. İletişim</h2>
        <p>
          Kullanım koşulları ile ilgili sorularınız için lütfen destek veya uygulama
          sahibi ile iletişime geçin.
        </p>

        <p className="pt-6">
          <Link href="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Ana sayfaya dön
          </Link>
        </p>
      </main>
    </div>
  );
}
