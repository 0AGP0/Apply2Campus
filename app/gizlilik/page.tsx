import Link from "next/link";

export const metadata = {
  title: "Gizlilik Politikası | Apply2Campus",
  description: "Apply2Campus gizlilik politikası.",
};

export default function GizlilikPage() {
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
        <h1>Gizlilik Politikası</h1>
        <p className="text-sm text-slate-500">Son güncelleme: Şubat 2026</p>

        <h2>1. Toplanan Bilgiler</h2>
        <p>
          Apply2Campus, hizmet sunabilmek için e-posta adresiniz, adınız ve (öğrenci
          kullanıcıları için) Google hesabınızla bağlantı kurulduğunda Gmail ile ilgili
          erişim bilgilerini işler. Bu veriler yalnızca danışmanlık ve e-posta senkronizasyonu
          amacıyla kullanılır.
        </p>

        <h2>2. Verilerin Kullanımı</h2>
        <p>
          Toplanan bilgiler öğrenci-danışman iletişimini yönetmek, e-posta okuma/gönderme
          özelliklerini çalıştırmak ve hizmeti iyileştirmek için kullanılır. Verileriniz
          üçüncü taraflara satılmaz.
        </p>

        <h2>3. Google / Gmail Erişimi</h2>
        <p>
          Gmail bağlantısı Google OAuth ile güvenli şekilde yapılır. Erişim izinleri yalnızca
          maillerinizi okumak ve (sizin adınıza) yanıt göndermekle sınırlıdır. İstediğiniz
          zaman Ayarlar üzerinden bağlantıyı kaldırabilirsiniz.
        </p>

        <h2>4. Veri Güvenliği</h2>
        <p>
          Veriler şifreleme ve güvenli bağlantılar (HTTPS) ile korunur. Erişim yetkili
          kullanıcılarla sınırlıdır.
        </p>

        <h2>5. İletişim</h2>
        <p>
          Gizlilik ile ilgili sorularınız için lütfen uygulama sahibi veya destek e-posta
          adresi üzerinden bizimle iletişime geçin.
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
