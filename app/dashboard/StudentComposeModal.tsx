"use client";

import { useState } from "react";

export function StudentComposeModal({
  studentId,
  gmailAddress,
  onClose,
  onSent,
  initialTo,
  initialSubject,
}: {
  studentId: string;
  gmailAddress: string;
  onClose: () => void;
  onSent: () => void;
  initialTo?: string;
  initialSubject?: string;
}) {
  const [to, setTo] = useState(initialTo ?? "");
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!to.trim()) { alert("Alıcı girin."); return; }
    setSending(true);
    try {
      const html = body.trim() ? `<p>${body.replace(/\n/g, "</p><p>")}</p>` : "<p></p>";
      const res = await fetch(`/api/students/${studentId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim() || "(Konu yok)",
          html,
        }),
      });
      if (res.ok) onSent();
      else {
        const data = await res.json();
        alert(data.error ?? "Gönderilemedi.");
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Yeni mail</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="p-4 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800">
          Gönderen: {gmailAddress}
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alıcı</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Konu</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              placeholder="Konu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mesaj</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 min-h-[120px]"
              placeholder="Mesajınız..."
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            İptal
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
