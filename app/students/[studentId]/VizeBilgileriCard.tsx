"use client";

import { useState, useEffect } from "react";

type VisaInfo = {
  visaInstitution: string | null;
  visaCity: string | null;
  visaProgramStartDate: string | null;
  visaNotes: string | null;
};

export function VizeBilgileriCard({ studentId }: { studentId: string }) {
  const [info, setInfo] = useState<VisaInfo>({ visaInstitution: null, visaCity: null, visaProgramStartDate: null, visaNotes: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/students/${studentId}/vize`)
      .then((r) => r.json())
      .then((d) => {
        setInfo({
          visaInstitution: d.visaInstitution ?? "",
          visaCity: d.visaCity ?? "",
          visaProgramStartDate: d.visaProgramStartDate?.slice(0, 10) ?? "",
          visaNotes: d.visaNotes ?? "",
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [studentId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/vize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visaInstitution: info.visaInstitution || null,
        visaCity: info.visaCity || null,
        visaProgramStartDate: info.visaProgramStartDate || null,
        visaNotes: info.visaNotes || null,
      }),
    });
    setSaving(false);
    if (res.ok) load();
  }

  if (loading) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 sm:mb-8">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Vize bilgileri</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Öğrenci vize sayfasında bu bilgiler görünür.</p>
      </div>
      <form onSubmit={save} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kayıt olunan kurum</label>
          <input
            type="text"
            value={info.visaInstitution ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaInstitution: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            placeholder="Kurum adı"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Şehir</label>
          <input
            type="text"
            value={info.visaCity ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaCity: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            placeholder="Şehir"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Program başlangıç tarihi</label>
          <input
            type="date"
            value={info.visaProgramStartDate ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaProgramStartDate: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Bilgi (teklifin kabulü vb.)</label>
          <textarea
            value={info.visaNotes ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaNotes: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3 min-h-[80px]"
            placeholder="Ek bilgi"
            rows={3}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </section>
  );
}
