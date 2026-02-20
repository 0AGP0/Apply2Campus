"use client";

import { useState } from "react";
import Link from "next/link";

type StageItem = { slug: string; name: string };

type Student = {
  id: string;
  name: string;
  studentEmail: string | null;
  gmailAddress: string | null;
  stage: string;
  gmailConnection: {
    id: string;
    status: string;
    lastSyncAt: Date | null;
    provider: string;
  } | null;
};

export function StudentOverviewClient({
  student,
  stages,
}: {
  student: Student;
  stages: StageItem[];
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const conn = student.gmailConnection;
  const status = (conn?.status ?? "disconnected").toLowerCase();
  const stageName = stages.find((s) => s.slug === student.stage)?.name ?? student.stage;

  async function handleDisconnect() {
    if (
      !confirm(
        "Bu öğrenci için Gmail bağlantısı kesilsin mi? Senkron ve gönderim için tekrar bağlamaları gerekecek."
      )
    )
      return;
    setDisconnecting(true);
    await fetch(`/api/students/${student.id}/disconnect`, { method: "POST" });
    setDisconnecting(false);
    window.location.reload();
  }

  const links = [
    { href: `/students/${student.id}/profil`, label: "Profil (CRM)", icon: "person" },
    { href: `/students/${student.id}/belgeler`, label: "Belgeler", icon: "folder" },
    { href: `/students/${student.id}/vize`, label: "Vize bilgileri", icon: "badge" },
    { href: `/students/${student.id}/basvurular`, label: "Başvurular", icon: "school" },
    { href: `/students/${student.id}/teklifler`, label: "Teklifler", icon: "request_quote" },
    { href: `/students/${student.id}/inbox`, label: "Gelen kutusu", icon: "inbox" },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/10">
                <span className="text-xl sm:text-2xl font-bold text-primary">
                  {student.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              {status === "connected" && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                  {student.name}
                </h2>
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  {stageName}
                </span>
              </div>
              {student.studentEmail && (
                <p className="text-slate-500 flex items-center gap-1.5 text-sm">
                  <span className="material-icons-outlined text-sm">mail</span>
                  {student.studentEmail}
                </p>
              )}
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 w-full lg:w-72 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Gmail durumu
              </span>
              {status === "connected" && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                  Bağlı
                </span>
              )}
              {status === "expired" && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                  Süresi dolmuş
                </span>
              )}
              {status !== "connected" && status !== "expired" && (
                <span className="text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded">
                  Bağlı değil
                </span>
              )}
            </div>
            {conn && (
              <>
                <div className="space-y-1.5 mb-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Son senkron</span>
                    <span className="font-medium">
                      {conn.lastSyncAt
                        ? new Date(conn.lastSyncAt).toLocaleString("tr-TR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "Hiç"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sağlayıcı</span>
                    <span className="font-medium">{conn.provider}</span>
                  </div>
                </div>
                {status === "connected" && (
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">link_off</span>
                    Bağlantıyı kes
                  </button>
                )}
                {(status === "expired" || status === "disconnected") && (
                  <a
                    href={`/api/oauth/gmail/start?studentId=${student.id}`}
                    className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 hover:bg-primary/90"
                  >
                    <span className="material-icons-outlined text-sm">link</span>
                    {status === "expired" ? "Yeniden yetkilendir" : "Gmail bağla"}
                  </a>
                )}
              </>
            )}
            {!conn && status !== "connected" && status !== "expired" && (
              <a
                href={`/api/oauth/gmail/start?studentId=${student.id}`}
                className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 hover:bg-primary/90"
              >
                <span className="material-icons-outlined text-sm">link</span>
                Gmail bağla
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-primary text-xl">{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-white">{item.label}</p>
              <p className="text-xs text-slate-500">Detay için tıklayın</p>
            </div>
            <span className="material-icons-outlined text-slate-400 ml-auto shrink-0">
              arrow_forward
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
