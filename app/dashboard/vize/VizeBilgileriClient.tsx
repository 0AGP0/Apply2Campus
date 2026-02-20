"use client";

import { useState, useEffect } from "react";

type VisaInfo = {
  visaInstitution: string | null;
  visaCity: string | null;
  visaProgramStartDate: string | null;
  visaNotes: string | null;
};

export function VizeBilgileriClient({ studentId }: { studentId: string }) {
  const [info, setInfo] = useState<VisaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/students/${studentId}/vize`)
      .then((r) => r.json())
      .then((d) => {
        setInfo({
          visaInstitution: d.visaInstitution ?? null,
          visaCity: d.visaCity ?? null,
          visaProgramStartDate: d.visaProgramStartDate ?? null,
          visaNotes: d.visaNotes ?? null,
        });
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  const hasAny = info?.visaInstitution || info?.visaCity || info?.visaProgramStartDate || info?.visaNotes;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {!hasAny ? (
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
            <span className="material-icons-outlined text-2xl">info</span>
            <span>Bu bölüm danışmanınız vize sürecinizi başlattığında doldurulacaktır.</span>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 space-y-4">
          {info?.visaInstitution && (
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kayıt olunan kurum</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{info.visaInstitution}</dd>
            </div>
          )}
          {info?.visaCity && (
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Şehir</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{info.visaCity}</dd>
            </div>
          )}
          {info?.visaProgramStartDate && (
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Program başlangıç tarihi</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200">{new Date(info.visaProgramStartDate).toLocaleDateString("tr-TR")}</dd>
            </div>
          )}
          {info?.visaNotes && (
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bilgi</dt>
              <dd className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{info.visaNotes}</dd>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
