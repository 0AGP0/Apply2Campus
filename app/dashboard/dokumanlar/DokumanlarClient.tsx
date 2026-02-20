"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocumentStatusLabel, getDocumentStatusBadgeClass } from "@/lib/document-status";

type Field = { id: string; slug: string; label: string; type: string; allowMultiple: boolean };
type Section = { id: string; slug: string; name: string; fields: Field[] };
type DocItem = { id: string; fieldSlug: string; fileName: string; uploadedAt: string; version?: number; status?: string };
type Category = { id: string; slug: string; name: string; type: string };
type DocByCat = { id: string; categorySlug: string; categoryName: string; categoryType: string; fileName: string; version: number; status: string; uploadedAt: string };

export function DokumanlarClient({ studentId }: { studentId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documentsByCat, setDocumentsByCat] = useState<DocByCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [formRes, dataRes, catRes, docCatRes] = await Promise.all([
      fetch("/api/crm/form"),
      fetch(`/api/students/${studentId}/crm`),
      fetch("/api/document-categories"),
      fetch(`/api/students/${studentId}/documents-by-category`),
    ]);
    if (!formRes.ok || !dataRes.ok) {
      setError("Veriler yüklenemedi");
      setLoading(false);
      return;
    }
    const formJson = await formRes.json();
    const dataJson = await dataRes.json();
    const all = (formJson.sections ?? []) as Section[];
    const docSection = all.find((s: Section) => s.slug === "documents");
    setSections(docSection ? [docSection] : []);
    setDocuments(dataJson.documents ?? []);

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
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  const fileFields = sections.flatMap((s) => s.fields).filter((f) => f.type === "FILE");
  const operationCategories = categories.filter((c) => c.type === "OPERATION_UPLOADED");
  const studentUploadCategories = categories.filter((c) => c.type === "STUDENT_UPLOADED");
  const docsByCategorySlug = documentsByCat.reduce((acc, d) => {
    if (!acc[d.categorySlug]) acc[d.categorySlug] = [];
    acc[d.categorySlug].push(d);
    return acc;
  }, {} as Record<string, DocByCat[]>);

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* 3.5.1 Kişisel Belgeler ve tercümeler */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Kişisel Belgeler ve tercümeler</h2>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
          {fileFields.length === 0 ? (
            <div className="p-6 text-slate-500 dark:text-slate-400 text-sm">Henüz alan tanımlanmamış.</div>
          ) : (
            fileFields.map((field) => {
              const docs = documents.filter((d) => d.fieldSlug === field.slug);
              const isUploading = uploading === field.slug;
              return (
                <div key={field.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{field.label}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{field.allowMultiple ? "Birden fazla dosya yükleyebilirsiniz." : "Tek dosya."}</p>
                    </div>
                    <div>
                      <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" id={`file-${field.slug}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCrm(field.slug, f); e.target.value = ""; }} disabled={!!isUploading} />
                      <label htmlFor={`file-${field.slug}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 cursor-pointer disabled:opacity-50">
                        <span className="material-icons-outlined text-lg">upload</span>
                        {isUploading ? "Yükleniyor..." : "Dosya yükle"}
                      </label>
                    </div>
                  </div>
                  {docs.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {docs.map((d) => (
                        <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="material-icons-outlined text-slate-400">attach_file</span>
                          <a href={`/api/students/${studentId}/documents/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{d.fileName}</a>
                          <span className="text-xs text-slate-500">v{d.version ?? 1} · {new Date(d.uploadedAt).toLocaleDateString("tr-TR")}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDocumentStatusBadgeClass(d.status)}`}>{getDocumentStatusLabel(d.status)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 3.5.2 Operasyonun yüklediği belgeler */}
      {operationCategories.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Operasyonun yüklediği belgeler</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Bu belgeler operasyon/danışman tarafından yüklenir. Görüntüleyip indirebilirsiniz.</p>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
            {operationCategories.map((cat) => {
              const docs = docsByCategorySlug[cat.slug] ?? [];
              return (
                <div key={cat.id} className="p-6">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cat.name}</h3>
                  {docs.length === 0 ? (
                    <p className="text-xs text-slate-500 mt-2">Henüz yüklenmedi.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {docs.map((d) => (
                        <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="material-icons-outlined text-slate-400">attach_file</span>
                          <a href={`/api/students/${studentId}/documents-by-category/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{d.fileName}</a>
                          <span className="text-xs text-slate-500">v{d.version} · {new Date(d.uploadedAt).toLocaleDateString("tr-TR")}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDocumentStatusBadgeClass(d.status)}`}>{getDocumentStatusLabel(d.status)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3.5.2 Öğrenci evrak yükle (açılır liste) */}
      {studentUploadCategories.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">Evrak yükle</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Aşağıdaki kategorilerden birini seçip dosya yükleyebilirsiniz.</p>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
            {studentUploadCategories.map((cat) => {
              const docs = docsByCategorySlug[cat.slug] ?? [];
              const isUploading = uploading === cat.slug;
              return (
                <div key={cat.id} className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{cat.name}</h3>
                    <div>
                      <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" id={`cat-${cat.slug}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadByCategory(cat.slug, f); e.target.value = ""; }} disabled={!!isUploading} />
                      <label htmlFor={`cat-${cat.slug}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 cursor-pointer disabled:opacity-50">
                        <span className="material-icons-outlined text-lg">upload</span>
                        {isUploading ? "Yükleniyor..." : "Dosya yükle"}
                      </label>
                    </div>
                  </div>
                  {docs.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {docs.map((d) => (
                        <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="material-icons-outlined text-slate-400">attach_file</span>
                          <a href={`/api/students/${studentId}/documents-by-category/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{d.fileName}</a>
                          <span className="text-xs text-slate-500">v{d.version} · {new Date(d.uploadedAt).toLocaleDateString("tr-TR")}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDocumentStatusBadgeClass(d.status)}`}>{getDocumentStatusLabel(d.status)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
