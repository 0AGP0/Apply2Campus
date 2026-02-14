"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

async function signInWithCredentials(email: string, password: string, callbackUrl: string) {
  const csrfRes = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: callbackUrl || "/",
      json: "true",
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error ?? "Giriş başarısız" };
  }
  return { ok: true };
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const callbackUrl = (searchParams.get("callbackUrl") as string) || "/";
    const res = await signInWithCredentials(email, password, callbackUrl);
    setLoading(false);
    if (!res.ok) {
      setError("Geçersiz e-posta veya şifre");
      return;
    }
    window.location.href = callbackUrl;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Arka plan: gradient + hafif desen */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div
        className="absolute inset-0 opacity-40 dark:opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgb(14 165 233 / 0.15) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      {/* Dekoratif blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200/40 dark:bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-card-hover border border-slate-200/80 dark:border-slate-700 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-icons-outlined text-white text-2xl">school</span>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white block">
                Apply2Campus
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Danışman & Admin Portal</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Giriş yap</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            E-posta ve şifrenizle devam edin
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-300 text-sm rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-2">
                <span className="material-icons-outlined text-lg">error_outline</span>
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder:text-slate-400"
                placeholder="ornek@apply2campus.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all placeholder:text-slate-400"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş yap
                  <span className="material-icons-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            Öğrenci misin?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <LoginForm />
    </Suspense>
  );
}
