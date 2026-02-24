import Link from "next/link";

// Google OAuth Privacy Policy için: Gerçek destek e-postanızla değiştirin.
const PRIVACY_EMAIL = "privacy@apply2campus.com";

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

        <h2>4. Google Kullanıcı Verilerine Erişim, Paylaşım ve Açıklama</h2>
        <p className="font-medium">Google kullanıcı verilerine erişim ve kullanım</p>
        <p>
          Uygulamamız, yalnızca temel işlevselliği sunmak amacıyla Google kullanıcı verilerine erişir.
          Yalnızca uygulamanın çalışması için gerekli minimum izinleri (kapsamları) talep ederiz.
          Google kullanıcı verileri reklam, profil oluşturma veya yeniden satış amacıyla kullanılmaz.
        </p>
        <p className="font-medium mt-6">Google kullanıcı verilerinin paylaşımı ve açıklanması</p>
        <p>
          Google kullanıcı verilerini üçüncü taraflara satmıyor, kiraya vermiyor veya takas etmiyoruz.
          Google kullanıcı verileri yalnızca aşağıdaki sınırlı durumlarda paylaşılabilir:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Uygulamanın işletilmesi ve bakımı amacıyla güvenilir hizmet sağlayıcılarıyla (bulut barındırma veya otomasyon platformları gibi).</li>
          <li>Yasa, düzenleme veya hukuki süreç gerektirdiğinde.</li>
          <li>Kullanıcılarımızın veya kamuoyunun haklarını, güvenliğini veya güvenliğini korumak için.</li>
        </ul>
        <p>Tüm üçüncü taraf hizmet sağlayıcıları, kullanıcı verilerini korumak ve yalnızca uygulamamıza hizmet sunmak için kullanmakla sözleşmeyle yükümlüdür.</p>
        <p className="font-medium mt-6">Veri saklama politikası</p>
        <p>
          Google kullanıcı verilerini yalnızca uygulamanın işlevselliğini sunmak için gerekli olduğu sürece saklarız.
          Saklamaya devam gerekmiyorsa, Google kullanıcı verileri sistemlerimizden güvenli bir şekilde silinir.
          Google kullanıcı verilerini meşru operasyonel amaçlar için gerekenden daha uzun süre saklamıyoruz.
        </p>
        <p className="font-medium mt-6">Veri silme politikası</p>
        <p>
          Kullanıcılar, Google kullanıcı verilerinin silinmesini istedikleri zaman bize şu adresten ulaşabilir:{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{PRIVACY_EMAIL}</a>.
          Silme talebi aldığımızda, ilgili tüm Google kullanıcı verilerini 30 gün içinde kalıcı olarak sileriz.
          Kullanıcı Google hesabını uygulamamızdan ayırırsa, saklanan tüm Google kullanıcı verileri makul bir süre içinde otomatik olarak silinir.
        </p>
        <p className="font-medium mt-6">Sınırlı kullanım uyumluluğu</p>
        <p>
          Uygulamamız, Sınırlı Kullanım gereksinimleri dahil olmak üzere Google API Hizmetleri Kullanıcı Verileri Politikasına uygundur.
          Google kullanıcı verilerini şu amaçlarla kullanmıyoruz: reklam sunmak; uygulama işlevselliğiyle ilgisi olmayan kullanıcı profilleri oluşturmak; veri aracılarına satmak veya devretmek.
          Google kullanıcı verileri yalnızca uygulamanın temel özelliklerini sunmak ve iyileştirmek için kullanılır.
        </p>

        <h2>5. Veri Güvenliği</h2>
        <p>
          Veriler şifreleme ve güvenli bağlantılar (HTTPS) ile korunur. Erişim yetkili
          kullanıcılarla sınırlıdır.
        </p>

        <h2>6. İletişim</h2>
        <p>
          Gizlilik veya veri silme talepleri için:{" "}
          <a href={`mailto:${PRIVACY_EMAIL}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{PRIVACY_EMAIL}</a>.
          Diğer sorularınız için uygulama sahibi veya destek e-posta adresi üzerinden bizimle iletişime geçebilirsiniz.
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
