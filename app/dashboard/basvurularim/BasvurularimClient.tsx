"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  BASVURU_YAPILDI: "Başvuru yapıldı",
  KABUL_BEKLENIYOR: "Kabul bekleniyor",
  KABUL_ALINDI: "Kabul alındı",
  REDDEDILDI: "Reddedildi",
};

type Application = {
  id: string;
  universityName: string;
  program: string | null;
  applicationDate: string | null;
  status: string;
  notes: string | null;
  secondInstallmentAmount: number | null;
  secondInstallmentDueDate: string | null;
  acceptanceDocument: { id: string; fileName: string; status: string; uploadedAt: string } | null;
};

export function BasvurularimClient({ studentId }: { studentId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/applications")
      .then((r) => r.json())
      .then((d) => setApplications(Array.isArray(d.applications) ? d.applications : []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <span className="material-icons-outlined text-5xl text-slate-300 dark:text-slate-600 mb-4">school</span>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">
          Henüz üniversite başvurunuz bulunmuyor.
        </p>
        <p className="text-slate-500 dark:text-slate-500 text-xs mb-6">
          Danışmanınız başvurularınızı eklediğinde burada listelenecektir. Kabul belgesi yüklendiğinde ilgili başvuruda 2. taksit ödemesi görünecektir.
        </p>
        <Link
          href="/dashboard/profilim"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <span className="material-icons-outlined text-lg">person</span>
          Profil bilgilerini güncelle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:border-primary/30 transition-colors"
        >
          <div className="p-6 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                  {app.universityName}
                </h3>
                {app.program && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{app.program}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {app.applicationDate && (
                    <span>Başvuru: {new Date(app.applicationDate).toLocaleDateString("tr-TR")}</span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${
                      app.status === "KABUL_ALINDI"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : app.status === "REDDEDILDI"
                          ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                          : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </div>
                {app.notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{app.notes}</p>
                )}
              </div>
              {app.acceptanceDocument && (app.secondInstallmentAmount != null || app.secondInstallmentDueDate) && (
                <div className="rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-4 min-w-[180px]">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                    2. Taksit
                  </p>
                  {app.secondInstallmentAmount != null && (
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {app.secondInstallmentAmount.toLocaleString("tr-TR")} €
                    </p>
                  )}
                  {app.secondInstallmentDueDate && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Son ödeme: {new Date(app.secondInstallmentDueDate).toLocaleDateString("tr-TR")}
                    </p>
                  )}
                  <a
                    href={`/api/students/${studentId}/documents-by-category/${app.acceptanceDocument.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2"
                  >
                    Kabul belgesi
                    <span className="material-icons-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
