"use client";

import { useState } from "react";
import Link from "next/link";
import { InfoCard } from "@/components/InfoCard";
import { CrmCardClient } from "./CrmCardClient";
import { StudentOffersSection } from "./StudentOffersSection";

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

export function StudentDetailClient({
  student,
  stages,
}: {
  student: Student;
  stages: StageItem[];
}) {
  const [disconnecting, setDisconnecting] = useState(false);
  const conn = student.gmailConnection;
  const status = conn?.status ?? "disconnected";
  const stageName = stages.find((s) => s.slug === student.stage)?.name ?? student.stage;

  async function handleDisconnect() {
    if (!confirm("Bu öğrenci için Gmail bağlantısı kesilsin mi? Senkron ve gönderim için tekrar bağlamaları gerekecek."))
      return;
    setDisconnecting(true);
    await fetch(`/api/students/${student.id}/disconnect`, { method: "POST" });
    setDisconnecting(false);
    window.location.reload();
  }

  return (
    <>
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/10">
                <span className="text-xl sm:text-3xl font-bold text-primary">
                  {student.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              {status === "connected" && (
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {student.name}
                </h2>
                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
                  {stageName}
                </span>
              </div>
              <div className="flex flex-col gap-1 mb-3">
                {student.studentEmail && (
                  <p className="text-slate-500 flex items-center gap-2 text-sm">
                    <span className="material-icons-outlined text-sm">mail</span>
                    {student.studentEmail}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 w-full lg:min-w-[280px] lg:w-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Bağlantı durumu
              </span>
              {status === "connected" && (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                  Bağlı
                </span>
              )}
              {status === "expired" && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                  Süresi dolmuş
                </span>
              )}
              {status === "disconnected" && (
                <span className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/30 px-2 py-0.5 rounded">
                  Bağlı değil
                </span>
              )}
            </div>
            {conn && (
              <>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Son senkron:</span>
                    <span className="font-medium">
                      {conn.lastSyncAt
                        ? new Date(conn.lastSyncAt).toLocaleString()
                        : "Hiç"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Sağlayıcı:</span>
                    <span className="font-medium">{conn.provider} (OAuth 2.0)</span>
                  </div>
                </div>
                {status === "connected" && (
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">link_off</span>
                    Posta kutusunu ayır
                  </button>
                )}
                {status === "expired" && (
                  <a
                    href={`/api/oauth/gmail/start?studentId=${student.id}`}
                    className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 hover:bg-primary/90"
                  >
                    Gmail’i yeniden yetkilendir
                  </a>
                )}
              </>
            )}
            {status === "disconnected" && (
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

      <CrmCardClient studentId={student.id} editable />

      <StudentOffersSection studentId={student.id} />

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 overflow-hidden">
        <nav className="flex border-b border-primary/10 bg-slate-50 dark:bg-slate-800/50 overflow-x-auto">
          <Link
            href={`/students/${student.id}/inbox`}
            className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-primary border-b-2 border-primary bg-white dark:bg-slate-900 flex items-center gap-2 shrink-0"
          >
            <span className="material-icons-outlined text-base sm:text-lg">inbox</span>
            Gelen kutusu
          </Link>
          <Link
            href={`/students/${student.id}/inbox?label=SENT`}
            className="px-4 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-2 border-b-2 border-transparent shrink-0"
          >
            <span className="material-icons-outlined text-base sm:text-lg">send</span>
            Gönderilen
          </Link>
        </nav>
        <div className="p-6 text-center border-t border-primary/5 bg-slate-50/50 dark:bg-slate-800/20">
          <Link
            href={`/students/${student.id}/inbox`}
            className="text-primary font-medium hover:underline inline-flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">inbox</span>
            Mailleri görüntülemek ve göndermek için gelen kutusunu aç
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <InfoCard variant="neutral" title="Aşamalar ne anlama geliyor?" icon="flag">
          <strong>Lead</strong> başvuru öncesi, <strong>Applied</strong> başvuru yapıldı, <strong>Reviewing</strong> değerlendirme aşamasında, <strong>Visa</strong> vize sürecinde, <strong>Enrolled</strong> kayıt tamamlandı. Aşamayı yukarıdaki profil kartındaki açılır menüden güncelleyebilirsiniz.
        </InfoCard>
        <InfoCard variant="tip" title="Gelen kutusu nasıl kullanılır?" icon="mail">
          <strong>Gelen kutusu</strong> sekmesinde öğrencinin Gmail’inden gelen ve giden mailleri görürsünüz. Yeni mail göndermek için sayfadaki “Yeni mail” butonunu kullanın. Öğrenci Gmail bağlamamışsa önce “Gmail bağla” ile yetkilendirme yapması gerekir.
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
        <div className="panel-card p-4 sm:p-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-sm">link</span>
            Bağlantı özeti
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Durum</span>
              <span
                className={
                  status === "connected"
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : status === "expired"
                      ? "text-amber-600 dark:text-amber-400 font-semibold"
                      : "text-slate-500 font-medium"
                }
              >
                {status === "connected"
                  ? "Bağlı"
                  : status === "expired"
                    ? "Süresi dolmuş"
                    : "Bağlı değil"}
              </span>
            </div>
            {conn && (
              <>
                <div className="flex justify-between text-xs">
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
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Sağlayıcı</span>
                  <span className="font-medium">{conn.provider}</span>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="panel-card p-4 sm:p-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-sm">flag</span>
            Aşama
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20">
              {stageName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Aşama, öğrenci listesi sayfasındaki tablodan değiştirilir.
          </p>
        </div>
        <div className="panel-card p-4 sm:p-6">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-sm">bolt</span>
            Hızlı işlemler
          </h3>
          <div className="space-y-2">
            <Link
              href={`/students/${student.id}/inbox`}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/10 dark:hover:bg-primary/10 text-slate-700 dark:text-slate-300 hover:text-primary text-sm font-medium transition-colors"
            >
              <span className="material-icons-outlined text-lg">inbox</span>
              Gelen kutusu
            </Link>
            {status !== "connected" && (
              <a
                href={`/api/oauth/gmail/start?studentId=${student.id}`}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-sm font-semibold transition-colors"
              >
                <span className="material-icons-outlined text-lg">link</span>
                Gmail bağla
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
