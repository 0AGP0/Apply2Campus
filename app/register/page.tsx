"use client";

import { useState, Suspense } from "react";
import Link from "next/link";

async function signInWithCredentials(email: string, password: string) {
  const csrfRes = await fetch("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const res = await fetch("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken,
      email,
      password,
      callbackUrl: "/dashboard",
      json: "true",
    }),
  });
  return res.ok;
}

function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Kayıt başarısız");
      setLoading(false);
      return;
    }
    const signedIn = await signInWithCredentials(email, password);
    setLoading(false);
    if (signedIn) window.location.href = "/dashboard";
    else setError("Hesap oluştu. Lütfen giriş yapın.");
  }

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-icons-outlined text-white">school</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Apply2Campus
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Kayıt ol</h1>
        <p className="text-slate-500 text-sm mb-6">
          Öğrenci hesabı oluştur
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Ad Soyad
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ad Soyad"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="En az 6 karakter"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-medium py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {loading ? "Kaydediliyor..." : "Kayıt ol"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
