"use client";

import { useState, useEffect, useCallback } from "react";

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

type DocItem = { id: string; fieldSlug: string; fileName: string; uploadedAt: string };

export function CrmFormClient({ studentId }: { studentId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadForm = useCallback(async () => {
    const [formRes, dataRes] = await Promise.all([
      fetch("/api/crm/form"),
      fetch(`/api/students/${studentId}/crm`),
    ]);
    if (!formRes.ok || !dataRes.ok) {
      setError("Form yüklenemedi");
      return;
    }
    const formJson = await formRes.json();
    const dataJson = await dataRes.json();
    setSections(formJson.sections ?? []);
    const valMap: Record<string, string> = {};
    (dataJson.values ?? []).forEach((v: { fieldSlug: string; value: string }) => {
      valMap[v.fieldSlug] = v.value;
    });
    setValues(valMap);
    setDocuments(dataJson.documents ?? []);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const currentSection = sections[step];
  const totalSteps = sections.length;

  async function saveValues(fieldSlugs: string[]) {
    const payload = fieldSlugs
      .filter((slug) => values[slug] !== undefined)
      .map((slug) => ({ fieldSlug: slug, value: values[slug] ?? "" }));
    if (payload.length === 0) return;
    const res = await fetch(`/api/students/${studentId}/crm/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: payload }),
    });
    if (!res.ok) throw new Error("Kaydetme başarısız");
  }

  async function handleNext() {
    if (!currentSection) return;
    setSaving(true);
    setError("");
    try {
      const slugs = currentSection.fields.filter((f) => f.type !== "FILE").map((f) => f.slug);
      await saveValues(slugs);
      if (step < totalSteps - 1) setStep(step + 1);
    } catch (e) {
      setError("Kaydedilirken hata oluştu.");
    }
    setSaving(false);
  }

  async function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  async function uploadFile(fieldSlug: string, file: File) {
    const form = new FormData();
    form.append("fieldSlug", fieldSlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/crm/documents`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Yükleme başarısız");
    }
    const doc = await res.json();
    setDocuments((prev) => [...prev, { id: doc.id, fieldSlug, fileName: doc.fileName, uploadedAt: doc.uploadedAt }]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <p className="text-slate-500 dark:text-slate-400">
        Henüz form alanı tanımlanmamış. Lütfen danışmanınızla iletişime geçin.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Adım {step + 1} / {totalSteps}</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{currentSection?.name}</span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {currentSection?.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {field.type === "TEXT" && (
              <input
                type="text"
                value={values[field.slug] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                className="input-panel w-full"
                required={field.required}
              />
            )}
            {field.type === "EMAIL" && (
              <input
                type="email"
                value={values[field.slug] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                className="input-panel w-full"
                required={field.required}
              />
            )}
            {field.type === "TEL" && (
              <input
                type="tel"
                value={values[field.slug] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                className="input-panel w-full"
                required={field.required}
              />
            )}
            {field.type === "DATE" && (
              <input
                type="date"
                value={values[field.slug] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                className="input-panel w-full"
                required={field.required}
              />
            )}
            {field.type === "TEXTAREA" && (
              <textarea
                value={values[field.slug] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                className="input-panel w-full min-h-[100px]"
                required={field.required}
                rows={4}
              />
            )}
            {field.type === "CHECKBOX" && (
              <label className="flex items-center gap-2">
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
                  <label key={opt.value} className="flex items-center gap-2">
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
                className="input-panel w-full"
                required={field.required}
              >
                <option value="">Seçiniz</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {field.type === "FILE" && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadFile(field.slug, file);
                      e.target.value = "";
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Dosya yüklenemedi");
                    }
                  }}
                />
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  {documents.filter((d) => d.fieldSlug === field.slug).map((d) => (
                    <li key={d.id} className="flex items-center gap-2">
                      <span className="material-icons-outlined text-lg">attach_file</span>
                      <a
                        href={`/api/students/${studentId}/documents/${d.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {d.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrev}
          disabled={step === 0}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Önceki
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-primary text-white font-medium disabled:opacity-70 hover:bg-primary/90"
        >
          {saving ? "Kaydediliyor..." : step < totalSteps - 1 ? "Kaydet ve devam" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
