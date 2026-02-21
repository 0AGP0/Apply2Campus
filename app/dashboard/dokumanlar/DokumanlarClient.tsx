"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocumentStatusLabel, getDocumentStatusBadgeClass } from "@/lib/document-status";

type Field = { id: string; slug: string; label: string; type: string; allowMultiple: boolean };
type Section = { id: string; slug: string; name: string; fields: Field[] };
type DocItem = { id: string; fieldSlug: string; categorySlug?: string; fileName: string; uploadedAt: string; version?: number; status?: string };
type Category = { id: string; slug: string; name: string; type: string };
type DocByCat = { id: string; categorySlug: string; categoryName: string; categoryType: string; fileName: string; version: number; status: string; uploadedAt: string };

const TAB_LABELS = ["Kişisel Belgeler", "Operasyon Belgeleri"];

/**
 * Öğrenci Dökümanlar sayfası – Revize.txt 3.4 uyarınca:
 * 3.5.1 Kişisel Belgeler (CRM FILE + Öğrenci evrak kategorileri tek sekmede)
 * 3.5.2 Belgeler – Operasyonun yüklediği (öğrenci sadece görüntüler)
 */
export function DokumanlarClient({ studentId }: { studentId: string }) {
  const [activeTab, setActiveTab] = useState(0);
  const [sections, setSections] = useState<Section[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documentsByCat, setDocumentsByCat] = useState<DocByCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [formRes, crmRes, catRes, docCatRes] = await Promise.all([
      fetch("/api/crm/form"),
      fetch(`/api/students/${studentId}/crm`),
      fetch("/api/document-categories"),
      fetch(`/api/students/${studentId}/documents-by-category`),
    ]);
    if (!formRes.ok || !crmRes.ok) {
      setError("Veriler yüklenemedi");
      setLoading(false);
      return;
    }
    const formJson = await formRes.json();
    const crmJson = await crmRes.json();
    const all = (formJson.sections ?? []) as Section[];
    setSections(all);
    setDocuments(crmJson.documents ?? []);
    if (catRes.ok) {
      const catJson = await catRes.json();
      setCategories(catJson.categories ?? []);
    }
    if (docCatRes.ok) {
      const docCatJson = await docCatRes.json();
      setDocumentsByCat(docCatJson.documents ?? []);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadCrm(fieldSlug: string, file: File) {
    setUploading(fieldSlug);
    setError("");
    const form = new FormData();
    form.append("fieldSlug", fieldSlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/crm/documents`, { method: "POST", body: form });
    setUploading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Yükleme başarısız");
      return;
    }
    const doc = await res.json();
    setDocuments((prev) => [...prev, { id: doc.id, fieldSlug, fileName: doc.fileName, uploadedAt: doc.uploadedAt, version: doc.version, status: doc.status }]);
  }

  async function uploadByCategory(categorySlug: string, file: File) {
    setUploading(categorySlug);
    setError("");
    const form = new FormData();
    form.append("categorySlug", categorySlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/documents-by-category/upload`, { method: "POST", body: form });
    setUploading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Yükleme başarısız");
      return;
    }
    const doc = await res.json();
    setDocumentsByCat((prev) => [...prev, { id: doc.id, categorySlug: doc.categorySlug, categoryName: doc.categoryName, categoryType: doc.categoryType ?? "STUDENT_UPLOADED", fileName: doc.fileName, version: doc.version, status: doc.status, uploadedAt: doc.uploadedAt }]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-slate-500">Belgeler yükleniyor</span>
        </div>
      </div>
    );
  }

  const docSection = sections.find((s) => s.slug === "documents");
  const fileFields = (docSection?.fields ?? []).filter((f) => f.type === "FILE");
  const fallbackFileFields = sections.flatMap((s) => s.fields).filter((f) => f.type === "FILE");
  const fieldsToShow = fileFields.length > 0 ? fileFields : fallbackFileFields;

  const operationCategories = categories.filter((c) => c.type === "OPERATION_UPLOADED");
  const studentUploadCategories = categories.filter((c) => c.type === "STUDENT_UPLOADED");
  const docsByCategorySlug = documentsByCat.reduce((acc, d) => {
    if (!acc[d.categorySlug]) acc[d.categorySlug] = [];
    acc[d.categorySlug].push(d);
    return acc;
  }, {} as Record<string, DocByCat[]>);

  const revizeDocs = [
    ...documents.filter((d) => d.status === "REVISION_REQUESTED"),
    ...documentsByCat.filter((d) => d.status === "REVISION_REQUESTED").map((d) => ({ ...d, fieldSlug: "" })),
  ];

  const DocRow = ({ d, href }: { d: { fileName: string; version: number; status: string; uploadedAt: string }; href: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
      <span className="material-icons-outlined text-slate-400 group-hover:text-primary text-lg">description</span>
      <span className="text-sm text-slate-800 dark:text-slate-200 truncate flex-1">{d.fileName}</span>
      <span className="text-xs text-slate-500">v{d.version}</span>
      <span className="text-xs text-slate-500">{new Date(d.uploadedAt).toLocaleDateString("tr-TR")}</span>
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${getDocumentStatusBadgeClass(d.status)}`}>{getDocumentStatusLabel(d.status)}</span>
    </a>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Revize bekleyen – Revize 3.5.1: versiyonlama + durum */}
      {revizeDocs.length > 0 && (
        <section className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
            <span className="material-icons-outlined text-lg">warning</span>
            Revize bekleyen belgeler ({revizeDocs.length})
          </h2>
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">Aşağıdaki belgeleri güncelleyip tekrar yükleyin.</p>
          <ul className="space-y-1">
            {revizeDocs.map((d) => (
              <li key={d.id}>
                <a
                  href={d.categorySlug ? `/api/students/${studentId}/documents-by-category/${d.id}` : `/api/students/${studentId}/documents/${d.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-amber-800 dark:text-amber-200 hover:underline"
                >
                  {d.fileName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sekmeler – Profilim ile aynı görsel dil */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-700 px-4 pt-4">
          {TAB_LABELS.map((label, i) => (
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

        <div className="p-6 sm:p-8">
          {/* 3.5.1 Kişisel Belgeler – CRM + Öğrenci evrak kategorileri */}
          {activeTab === 0 && (
      <section className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Kişisel Belgeler ve tercümeler</h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800">
            {fieldsToShow.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                Belge alanları tanımlı değil. Veritabanı seed&apos;lerinin çalıştırıldığından emin olun: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">db:seed</code>
              </div>
            ) : (
              fieldsToShow.map((field) => {
                const docs = documents.filter((d) => d.fieldSlug === field.slug);
                const isUploading = uploading === field.slug;
                return (
                  <div key={field.id} className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{field.label}</h3>
                      <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" id={`file-${field.slug}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCrm(field.slug, f); e.target.value = ""; }} disabled={!!isUploading} />
                      <label htmlFor={`file-${field.slug}`} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer shrink-0">
                        {isUploading ? "Yükleniyor..." : "Yükle"}
                      </label>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Henüz yüklenmedi</p>
                    ) : (
                      <div className="space-y-1 mt-2">
                        {docs.map((d) => <DocRow key={d.id} d={{ ...d, version: d.version ?? 1, status: d.status ?? "UPLOADED" }} href={`/api/students/${studentId}/documents/${d.id}`} />)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {/* Öğrenci evrak kategorileri – Danışmanlık, Kimlik, Taksit vb. */}
        {studentUploadCategories.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Sözleşme ve Ödeme Belgeleri</h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800">
              {studentUploadCategories.map((cat) => {
                const docs = docsByCategorySlug[cat.slug] ?? [];
                const isUploading = uploading === cat.slug;
                return (
                  <div key={cat.id} className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat.name}</h3>
                      <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" id={`cat-${cat.slug}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadByCategory(cat.slug, f); e.target.value = ""; }} disabled={!!isUploading} />
                      <label htmlFor={`cat-${cat.slug}`} className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 cursor-pointer shrink-0">
                        {isUploading ? "Yükleniyor..." : "Yükle"}
                      </label>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Henüz yüklenmedi</p>
                    ) : (
                      <div className="space-y-1">
                        {docs.map((d) => <DocRow key={d.id} d={d} href={`/api/students/${studentId}/documents-by-category/${d.id}`} />)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
          )}

          {/* 3.5.2 Belgeler – Operasyonun yüklediği (öğrenci sadece görüntüler) – Revize */}
          {activeTab === 1 && (
      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-2">Belgeler (Operasyonun yüklediği)</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Bu belgeler operasyon/danışman tarafından yüklenir. Görüntüleyip indirebilirsiniz.</p>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800">
          {operationCategories.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Belge kategorileri tanımlı değil. <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">db:seed-document-categories</code> çalıştırın.
            </div>
          ) : (
            operationCategories.map((cat) => {
              const docs = docsByCategorySlug[cat.slug] ?? [];
              return (
                <div key={cat.id} className="p-4">
                  <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{cat.name}</h3>
                  {docs.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Henüz yüklenmedi</p>
                  ) : (
                    <div className="space-y-1">
                      {docs.map((d) => <DocRow key={d.id} d={d} href={`/api/students/${studentId}/documents-by-category/${d.id}`} />)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
          )}
        </div>
      </div>
    </div>
  );
}
