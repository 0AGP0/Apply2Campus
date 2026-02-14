"use client";

import { useState } from "react";

type SignOutModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SignOutModal({ open, onClose }: SignOutModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await fetch("/api/auth/signout?callbackUrl=/login", {
        method: "GET",
        credentials: "include",
        redirect: "manual",
      });
    } catch (_) {}
    window.location.href = "/login";
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signout-title"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-amber-600 dark:text-amber-400 text-2xl">logout</span>
          </div>
          <h2 id="signout-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            Oturumu kapat
          </h2>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
          Çıkmak istediğinize emin misiniz?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Çıkılıyor…" : "Çıkış yap"}
          </button>
        </div>
      </div>
    </div>
  );
}
