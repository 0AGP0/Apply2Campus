"use client";

import { useState, useEffect, useCallback } from "react";

const COUNTRY_OPTIONS = [
  { value: "TR", label: "Türkiye" }, { value: "DE", label: "Almanya" }, { value: "AT", label: "Avusturya" },
  { value: "CH", label: "İsviçre" }, { value: "US", label: "ABD" }, { value: "GB", label: "Birleşik Krallık" },
  { value: "NL", label: "Hollanda" }, { value: "FR", label: "Fransa" }, { value: "IT", label: "İtalya" },
  { value: "ES", label: "İspanya" }, { value: "AZ", label: "Azerbaycan" }, { value: "KZ", label: "Kazakistan" },
  { value: "OTHER", label: "Diğer" },
];

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

function FieldInput({
  field,
  value,
  onChange,
  getOptions,
  onFileUpload,
  documents,
  studentId,
}: {
  field: Field;
  value: string;
  onChange: (v: string) => void;
  getOptions: (f: Field) => { value: string; label: string }[];
  onFileUpload: (slug: string, file: File) => Promise<void>;
  documents: DocItem[];
  studentId: string;
}) {
  const docs = documents.filter((d) => d.fieldSlug === field.slug);
  const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  if (field.type === "TEXT") return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  if (field.type === "EMAIL") return <input type="email" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  if (field.type === "TEL") return <input type="tel" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  if (field.type === "DATE") return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  if (field.type === "TEXTAREA") return <textarea value={value} onChange={(e) => onChange(e.target.value)} className={inputClass + " min-h-[96px] resize-y"} rows={3} />;
  if (field.type === "CHECKBOX") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={value === "true"} onChange={(e) => onChange(e.target.checked ? "true" : "false")} className="rounded border-slate-300 text-primary focus:ring-primary" />
        <span className="text-sm text-slate-600 dark:text-slate-400">Evet</span>
      </label>
    );
  }
  if (field.type === "RADIO") {
    return (
      <div className="flex flex-wrap gap-3">
        {(field.options ?? []).map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={field.slug} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="text-primary focus:ring-primary" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }
  if (field.type === "SELECT") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Seçiniz</option>
        {getOptions(field).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === "FILE") {
    return (
      <div className="space-y-2">
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              await onFileUpload(field.slug, file);
              e.target.value = "";
            }
          }}
        />
        {docs.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {docs.map((d) => (
              <li key={d.id}>
                <a href={`/api/students/${studentId}/documents/${d.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline py-1">
                  <span className="material-icons-outlined text-base">attach_file</span>
                  {d.fileName}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return null;
}

export function StudentCrmCard({ studentId }: { studentId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
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
    setSections(formJson.sections ?? []);
    const valMap: Record<string, string> = {};
    (dataJson.values ?? []).forEach((v: { fieldSlug: string; value: string }) => {
      valMap[v.fieldSlug] = v.value;
    });
    setValues(valMap);
    setDocuments(dataJson.documents ?? []);
    if ((formJson.sections ?? []).length > 0 && !openSection) setOpenSection(formJson.sections[0].id);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function saveSection(section: Section) {
    const slugs = section.fields.filter((f) => f.type !== "FILE").map((f) => f.slug);
    const payload = slugs.filter((s) => values[s] !== undefined).map((s) => ({ fieldSlug: s, value: values[s] ?? "" }));
    if (payload.length === 0) return;
    const res = await fetch(`/api/students/${studentId}/crm/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: payload }),
    });
    if (!res.ok) throw new Error("Kaydetme başarısız");
  }

  async function handleSaveSection(section: Section) {
    setSaving(true);
    setError("");
    setSaveSuccess(false);
    try {
      await saveSection(section);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setError("Kaydedilirken hata oluştu.");
    }
    setSaving(false);
  }

  async function uploadFile(fieldSlug: string, file: File) {
    const form = new FormData();
    form.append("fieldSlug", fieldSlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/crm/documents`, { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Yükleme başarısız");
    }
    const doc = await res.json();
    setDocuments((prev) => [...prev, { id: doc.id, fieldSlug, fileName: doc.fileName, uploadedAt: doc.uploadedAt }]);
  }

  function getOptions(field: Field) {
    if (field.slug === "country" && (!field.options || field.options.length === 0)) return COUNTRY_OPTIONS;
    return field.options ?? [];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <p className="text-slate-500 dark:text-slate-400 py-6 text-sm">
        Henüz alan tanımlanmamış. Danışmanınızla iletişime geçin.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
      {/* Kart başlığı */}
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <span className="material-icons-outlined text-primary">badge</span>
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Başvuru kartım</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bölümleri doldurup kaydedebilirsin</p>
            </div>
          </div>
          {saveSuccess && (
            <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="material-icons-outlined text-lg">check_circle</span>
              Kaydedildi
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 sm:mx-8 mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200/80 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <span className="material-icons-outlined shrink-0">error_outline</span>
          {error}
        </div>
      )}

      {/* Bölüm sekmeleri — pill + alt çizgi */}
      <div className="px-6 sm:px-8 pt-4">
        <div className="flex flex-wrap gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-700">
          {sections.map((sec) => {
            const isOpen = openSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setOpenSection(sec.id)}
                className={`
                  relative px-4 py-3 text-sm font-medium rounded-t-xl transition-colors
                  ${isOpen
                    ? "text-primary bg-white dark:bg-slate-900 -mb-px border border-slate-200 dark:border-slate-700 border-b-2 border-b-primary"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }
                `}
              >
                {sec.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Seçili bölüm içeriği */}
      {sections.map((sec) => {
        if (openSection !== sec.id) return null;
        return (
          <div key={sec.id} className="px-6 sm:px-8 py-6 sm:py-8">
            <div className="rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/80 p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                {sec.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                {sec.fields.map((field) => (
                  <div
                    key={field.id}
                    className={field.type === "TEXTAREA" || field.type === "FILE" ? "sm:col-span-2" : ""}
                  >
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <FieldInput
                      field={field}
                      value={values[field.slug] ?? ""}
                      onChange={(v) => setValues((prev) => ({ ...prev, [field.slug]: v }))}
                      getOptions={getOptions}
                      onFileUpload={uploadFile}
                      documents={documents}
                      studentId={studentId}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveSection(sec)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70 transition-colors shadow-sm"
                >
                  {saving ? "Kaydediliyor..." : "Bu bölümü kaydet"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
