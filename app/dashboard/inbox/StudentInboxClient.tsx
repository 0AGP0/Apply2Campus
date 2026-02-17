"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StudentComposeModal } from "../StudentComposeModal";
import { safeEmailBodyHtml } from "@/lib/sanitize";

type EmailMessage = {
  id: string;
  gmailMessageId: string;
  threadId: string;
  from: string | null;
  to: string | null;
  subject: string | null;
  snippet: string | null;
  internalDate: string | null;
  bodyHtml?: string | null;
  badges?: { id: string; name: string; color: string | null }[];
};

type ThreadMessage = EmailMessage & { bodyHtml?: string | null };

export function StudentInboxClient({
  studentId,
  studentName,
  gmailAddress,
  connectionStatus,
}: {
  studentId: string;
  studentName: string;
  gmailAddress: string;
  connectionStatus: string;
}) {
  const searchParams = useSearchParams();
  const label = searchParams.get("label") ?? "INBOX";
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<{ message: ThreadMessage; thread: ThreadMessage[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyPrefill, setReplyPrefill] = useState<{ to: string; subject: string } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!selectedId) {
      setThreadDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/students/${studentId}/emails/${selectedId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) setThreadDetail({ message: data.message, thread: data.thread ?? [data.message] });
        else setThreadDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }, [studentId, selectedId]);

  function fetchEmails() {
    setLoading(true);
    const params = new URLSearchParams({
      label,
      page: String(page),
      pageSize: "50",
      ...(search && { search }),
    });
    fetch(`/api/students/${studentId}/emails?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.messages ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchEmails();
  }, [studentId, label, page, search]);

  async function handleSync() {
    if (connectionStatus !== "connected") return;
    setSyncing(true);
    await fetch(`/api/students/${studentId}/sync`, { method: "POST" });
    fetchEmails();
    setSyncing(false);
  }

  if (connectionStatus !== "connected") {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <h3 className="text-base font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center gap-2">
            <span className="material-icons-outlined text-amber-600 dark:text-amber-400">mail</span>
            Gmail bağlantısı gerekli
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
            Burada maillerinizi görebilmeniz ve danışmanınızla paylaşabilmeniz için Gmail hesabınızı bağlamanız gerekiyor. Bağlantı güvenli (Google OAuth) ile yapılır; şifreniz hiçbir yerde girilmez.
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-4">
            Henüz bağlamadıysanız önce <strong>Dashboard</strong> veya <strong>Ayarlar</strong> sayfasındaki “Gmail ile Bağlan” adımını tamamlayın.
          </p>
          <a
            href="/api/oauth/gmail/start"
            className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <span className="material-icons-outlined text-lg">link</span>
            Gmail ile Bağlan
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 min-h-0 flex overflow-hidden">
      <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
        <div className="p-4">
          <button
            onClick={() => setComposeOpen(true)}
            disabled={connectionStatus !== "connected"}
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-icons-outlined text-sm">edit</span>
            Yeni Mail
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-6">
          <div className="space-y-1">
            <Link
              href="/dashboard/inbox"
              className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium ${
                label === "INBOX" ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-icons-outlined text-lg">inbox</span>
                <span className="text-sm">Gelen Kutusu</span>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{total}</span>
            </Link>
            <Link
              href="/dashboard/inbox?label=SENT"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                label === "SENT" ? "bg-primary/10 text-primary" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-icons-outlined text-lg">send</span>
              <span>Gönderilen</span>
            </Link>
          </div>
        </nav>
      </aside>

      <section className="w-[400px] border-r border-slate-200 dark:border-slate-800 bg-background-light dark:bg-slate-900/50 flex flex-col shrink-0 min-h-0">
        <div className="p-4 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="material-icons-outlined text-slate-400 text-lg hover:text-slate-600 disabled:opacity-50"
              title="Yenile"
            >
              refresh
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <span>1-{messages.length} / {total}</span>
          </div>
        </div>
        <div className="p-2 shrink-0 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <span className="material-icons-outlined absolute left-3 top-2 text-slate-400 text-sm">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
              placeholder="Mailde ara..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Yükleniyor...</div>
          ) : (
            messages.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.gmailMessageId)}
                className={`group border-b border-slate-200/60 dark:border-slate-800/60 p-4 cursor-pointer block transition-colors w-full text-left ${
                  selectedId === m.gmailMessageId
                    ? "bg-white dark:bg-slate-900 border-l-4 border-l-primary"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate block">{m.from ?? "—"}</span>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">
                    {m.internalDate ? new Date(m.internalDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate mb-1">{m.subject ?? "(Konu yok)"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{m.snippet ?? ""}</p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="flex-1 min-h-0 bg-white dark:bg-slate-900 flex overflow-hidden min-w-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <span className="material-icons-outlined text-4xl mb-2">mail</span>
              <p className="text-sm">Bir mail seçin veya yeni mail yazın</p>
              <p className="text-xs mt-1">{gmailAddress} üzerinden</p>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">Yükleniyor...</div>
          ) : threadDetail ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
                  {threadDetail.message.subject ?? "(Konu yok)"}
                </h1>
                <Link href={`/dashboard/inbox/${selectedId}`} className="text-xs text-primary hover:underline shrink-0">
                  Tam sayfa
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const from = threadDetail.message.from ?? "";
                    const to = from.replace(/^.*<([^>]+)>$/, "$1").trim() || from;
                    const subj = threadDetail.message.subject?.startsWith("Re:") ? threadDetail.message.subject : `Re: ${threadDetail.message.subject ?? ""}`;
                    setReplyPrefill({ to, subject: subj });
                    setComposeOpen(true);
                  }}
                  className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 shrink-0"
                >
                  <span className="material-icons-outlined text-lg">reply</span>
                  Yanıtla
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  {threadDetail.thread.map((m) => (
                    <div key={m.id} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {(m.from ?? "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{m.from ?? "—"}</div>
                            <div className="text-xs text-slate-500">Kime: {m.to ?? "—"}</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {m.internalDate ? new Date(m.internalDate).toLocaleString() : ""}
                        </div>
                      </div>
                      <div
                        className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: safeEmailBodyHtml(m.bodyHtml, m.snippet) }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">Mail yüklenemedi</div>
          )}
        </div>
      </section>

      {composeOpen && (
        <StudentComposeModal
          studentId={studentId}
          gmailAddress={gmailAddress}
          onClose={() => { setComposeOpen(false); setReplyPrefill(null); }}
          onSent={() => { setComposeOpen(false); setReplyPrefill(null); fetchEmails(); }}
          initialTo={replyPrefill?.to}
          initialSubject={replyPrefill?.subject}
        />
      )}
    </main>
  );
}
