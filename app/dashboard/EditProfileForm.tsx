"use client";

import { useState } from "react";

export function EditProfileForm({
  studentId,
  initialName,
  initialStudentEmail,
}: {
  studentId: string;
  initialName: string;
  initialStudentEmail: string | null;
}) {
  const [name, setName] = useState(initialName);
  const [studentEmail, setStudentEmail] = useState(initialStudentEmail ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || initialName,
          studentEmail: studentEmail.trim() || null,
        }),
      });
      if (res.ok) {
        setMessage({ type: "ok", text: "Bilgiler kaydedildi." });
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage({ type: "error", text: data.error ?? "Kaydedilemedi." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Ad Soyad
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Adınız soyadınız"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          E-posta (kurum / iletişim)
        </label>
        <input
          type="email"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="iletisim@example.com"
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Gmail bağlantısından farklı; danışmanla paylaşabileceğin iletişim e-postası.
        </p>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
