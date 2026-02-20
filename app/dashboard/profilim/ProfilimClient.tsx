"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type Field = {
  id: string;
  slug: string;
  label: string;
  type: string;
  required: boolean;
  options: { value: string; label: string }[] | null;
  allowMultiple: boolean;
};

type Section = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  fields: Field[];
};

const PROFILE_SLUGS = ["personal", "parents", "passport", "education"];
const INPUT_CLASS = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary";

export function ProfilimClient({ studentId }: { studentId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [formRes, dataRes] = await Promise.all([
      fetch("/api/crm/form"),
      fetch(`/api/students/${studentId}/crm`),
    ]);
    if (!formRes.ok || !dataRes.ok) {
      setError("Veriler yüklenemedi");
      setLoading(false);
      return;
    }
    const formJson = await formRes.json();
    const dataJson = await dataRes.json();
    const all = (formJson.sections ?? []) as Section[];
    const filtered = all.filter((s) => PROFILE_SLUGS.includes(s.slug)).sort((a, b) => a.sortOrder - b.sortOrder);
    setSections(filtered);
    const valMap: Record<string, string> = {};
    (dataJson.values ?? []).forEach((v: { fieldSlug: string; value: string }) => {
      valMap[v.fieldSlug] = v.value;
    });
    setValues(valMap);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const section = sections[activeTab];
    if (!section) return;
    const slugs = section.fields.filter((f) => f.type !== "FILE").map((f) => f.slug);
    const payload = slugs.map((s) => ({ fieldSlug: s, value: values[s] ?? "" }));
    if (payload.length === 0) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/students/${studentId}/crm/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: payload }),
    });
    setSaving(false);
    if (!res.ok) setError("Kaydedilirken hata oluştu.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  const tabs = [...sections.map((s) => s.name), "Ayarlar"];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700 px-4 pt-4">
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-4 py-3 text-sm font-medium rounded-t-xl transition-colors ${
              activeTab === i
                ? "text-primary bg-white dark:bg-slate-900 -mb-px border border-slate-200 dark:border-slate-700 border-b-2 border-b-primary"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {activeTab === tabs.length - 1 ? (
        <div className="p-6 sm:p-8">
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Şifre ve bildirim tercihlerinizi buradan güncelleyebilirsiniz.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
          >
            <span className="material-icons-outlined text-lg">settings</span>
            Ayarlar sayfasına git
          </Link>
        </div>
      ) : sections[activeTab] ? (
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {sections[activeTab].fields.map((field) => (
              <div
                key={field.id}
                className={field.type === "TEXTAREA" ? "sm:col-span-2" : ""}
              >
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                {field.type === "TEXT" && (
                  <input
                    type="text"
                    value={values[field.slug] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                )}
                {field.type === "EMAIL" && (
                  <input
                    type="email"
                    value={values[field.slug] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                )}
                {field.type === "TEL" && (
                  <input
                    type="tel"
                    value={values[field.slug] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                )}
                {field.type === "DATE" && (
                  <input
                    type="date"
                    value={values[field.slug] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                )}
                {field.type === "TEXTAREA" && (
                  <textarea
                    value={values[field.slug] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                    className={INPUT_CLASS + " min-h-[96px] resize-y"}
                    rows={3}
                  />
                )}
                {field.type === "CHECKBOX" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(values[field.slug] ?? "") === "true"}
                      onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.checked ? "true" : "false" }))}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Evet</span>
                  </label>
                )}
                {field.type === "RADIO" && (
                  <div className="flex flex-wrap gap-4">
                    {(field.options ?? []).map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.slug}
                          value={opt.value}
                          checked={(values[field.slug] ?? "") === opt.value}
                          onChange={() => setValues((v) => ({ ...v, [field.slug]: opt.value }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                )}
                {field.type === "SELECT" && (
                  <select
                    value={values[field.slug] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                    className={INPUT_CLASS}
                  >
                    <option value="">Seçiniz</option>
                    {(field.options ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70"
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
