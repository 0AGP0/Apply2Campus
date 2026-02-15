import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession, authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    const role = (session.user as { role?: string }).role ?? "CONSULTANT";
    if (role === "ADMIN") redirect("/admin");
    if (role === "STUDENT") redirect("/dashboard");
    redirect("/students");
  }

  const features = [
    {
      icon: "mail",
      title: "E-posta senkronizasyonu",
      description: "Öğrenci ve danışman mailleri tek platformda. Gmail güvenli OAuth ile bağlanır.",
    },
    {
      icon: "school",
      title: "Başvuru takibi",
      description: "Lead’den enrolled’a tüm aşamalar tek yerden yönetilir.",
    },
    {
      icon: "groups",
      title: "Danışman–öğrenci eşlemesi",
      description: "Her danışman atanmış öğrencilerini görür; öğrenci kendi panelinden erişir.",
    },
    {
      icon: "shield",
      title: "Güvenli erişim",
      description: "Şifreler ve token’lar şifrelenir; HTTPS ile korunur.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden">
      {/* Arka plan: gradient + desen + blobs */}
      <div className="fixed inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pointer-events-none" />
      <div
        className="fixed inset-0 opacity-50 dark:opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(14 165 233 / 0.12) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-indigo-300/30 dark:bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

      <header className="relative z-10 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-icons-outlined text-white text-xl">school</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              Apply2Campus
            </span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <Link
              href="/gizlilik"
              className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              Gizlilik
            </Link>
            <Link
              href="/kullanim-kosullari"
              className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary-light transition-colors"
            >
              Kullanım Koşulları
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Kayıt
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto mb-20">
          <p className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light mb-6">
            Öğrenci & Danışman Portalı
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-5 leading-tight">
            Yurt dışı başvurularınızı
            <br />
            <span className="text-primary">tek platformda</span> yönetin
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-10 leading-relaxed">
            Apply2Campus ile öğrenciler Gmail hesaplarını güvenle bağlar; danışmanlar
            e-postaları görüntüleyip yanıtlar. Başvuru aşamaları tek ekranda.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              <span className="material-icons-outlined text-lg">login</span>
              Giriş yap
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-icons-outlined text-lg">person_add</span>
              Kayıt ol
            </Link>
          </div>
        </section>

        {/* Özellikler */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-24">
          {features.map((f) => (
            <div
              key={f.icon}
              className="group relative rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 dark:group-hover:from-primary/40 dark:group-hover:to-primary/20 transition-colors">
                <span className="material-icons-outlined text-primary text-2xl">{f.icon}</span>
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </section>

        {/* Alt CTA */}
        <section className="rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-8 sm:p-12 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Hemen başlayın
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            Giriş yaparak öğrenci veya danışman panelinize ulaşın. Gmail bağlantısı isteğe bağlı
            ve Google OAuth ile güvence altında.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark shadow-md hover:shadow-lg transition-all"
          >
            Panele git
            <span className="material-icons-outlined text-lg">arrow_forward</span>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/gizlilik" className="hover:text-primary dark:hover:text-primary-light transition-colors">
            Gizlilik Politikası
          </Link>
          <Link href="/kullanim-kosullari" className="hover:text-primary dark:hover:text-primary-light transition-colors">
            Kullanım Koşulları
          </Link>
          <span className="text-slate-400 dark:text-slate-500">·</span>
          <span>Apply2Campus © {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}
