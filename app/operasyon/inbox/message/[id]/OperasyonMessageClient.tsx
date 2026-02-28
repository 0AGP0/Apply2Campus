"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeEmailBodyHtml } from "@/lib/sanitize";

type Message = {
  id: string;
  gmailMessageId: string;
  threadId: string;
  studentId: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  subject: string | null;
  snippet: string | null;
  bodyHtml: string | null;
  internalDate: Date | string | null;
};

type Student = { id: string; name: string };

export function OperasyonMessageClient({
  messageId,
  message,
  thread,
  students,
}: {
  messageId: string;
  message: Message & { student?: { id: string; name: string } | null };
  thread: Message[];
  students: Student[];
}) {
  const router = useRouter();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [linking, setLinking] = useState(false);

  const isLinked = !!message.studentId;

  const handleUnlink = async () => {
    if (!confirm("Bu mailin öğrenci bağlantısını kaldırmak istiyor musunuz?")) return;
    setLinking(true);
    try {
      const res = await fetch(`/api/operasyon/emails/${messageId}/link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: null }),
      });
      if (res.ok) {
        setLinkModalOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error ?? "Bağlantı kaldırılamadı");
      }
    } finally {
      setLinking(false);
    }
  };

  const handleLink = async () => {
    if (!selectedStudentId.trim()) return;
    setLinking(true);
    try {
      const res = await fetch(`/api/operasyon/emails/${messageId}/link`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setLinkModalOpen(false);
        setSelectedStudentId("");
        router.refresh();
        router.push(`/students/${selectedStudentId}/inbox/${message.gmailMessageId}`);
      } else {
        alert(data.error ?? "Bağlanamadı");
      }
    } finally {
      setLinking(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-900/10">
        <div className="flex flex-wrap items-center gap-3">
          {!isLinked ? (
            <>
              <span className="text-amber-700 dark:text-amber-400 text-sm font-medium flex items-center gap-2">
                <span className="material-icons-outlined text-lg">link_off</span>
                Bu mail henüz bir öğrenci dosyasına bağlı değil
              </span>
              <button
                type="button"
                onClick={() => setLinkModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
              >
                <span className="material-icons-outlined text-lg">person_add</span>
                Öğrenciye bağla
              </button>
            </>
          ) : (
            <>
              <span className="text-slate-600 dark:text-slate-400 text-sm">
                Öğrenci:{" "}
                <Link
                  href={`/students/${message.studentId}`}
                  className="font-medium text-primary hover:underline"
                >
                  {message.student?.name ?? ""}
                </Link>
              </span>
              <Link
                href={`/students/${message.studentId}/inbox/${message.gmailMessageId}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="material-icons-outlined text-base">open_in_new</span>
                Öğrenci inbox'ında aç
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudentId(message.studentId ?? "");
                  setLinkModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <span className="material-icons-outlined text-base">swap_horiz</span>
                Bağlantıyı değiştir
              </button>
              <button
                type="button"
                onClick={handleUnlink}
                disabled={linking}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="material-icons-outlined text-base">link_off</span>
                Bağlantıyı kaldır
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {thread.map((m) => (
            <div
              key={m.id}
              className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {(m.from ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {m.from ?? "Bilinmiyor"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">Alıcı: {m.to ?? "—"}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 shrink-0">
                  {m.internalDate
                    ? new Date(m.internalDate).toLocaleString("tr-TR")
                    : ""}
                </div>
              </div>
                <div className="email-body-iframe-wrapper rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700" style={{ minHeight: 200 }}>
                  <iframe
                    title="E-posta içeriği"
                    sandbox="allow-same-origin allow-popups"
                    srcDoc={safeEmailBodyHtml(m.bodyHtml, m.snippet)}
                    className="w-full border-0 min-h-[200px]"
                    style={{ height: "min(600px, 70vh)" }}
                  />
                </div>
            </div>
          ))}
        </div>
      </div>

      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              {isLinked ? "Bağlantıyı değiştir" : "Öğrenciye bağla"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Bu maili hangi öğrenci dosyasına bağlamak istiyorsunuz?
            </p>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm mb-4"
            >
              <option value="">Öğrenci seçin</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLinkModalOpen(false);
                  setSelectedStudentId("");
                }}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleLink}
                disabled={linking || !selectedStudentId}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {linking ? "Bağlanıyor…" : isLinked ? "Değiştir" : "Bağla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
