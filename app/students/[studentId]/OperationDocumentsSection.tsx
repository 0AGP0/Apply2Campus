"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocumentStatusLabel, getDocumentStatusBadgeClass } from "@/lib/document-status";

type Category = { id: string; slug: string; name: string; type: string };
type Doc = { id: string; categorySlug: string; categoryName: string; fileName: string; version: number; status: string; uploadedAt: string };

export function OperationDocumentsSection({ studentId }: { studentId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [catRes, docRes] = await Promise.all([
      fetch("/api/document-categories?type=OPERATION_UPLOADED"),
      fetch(`/api/students/${studentId}/documents-by-category`),
    ]);
    if (catRes.ok) {
      const j = await catRes.json();
      const list = j.categories ?? [];
      setCategories(list);
      if (list.length > 0 && !selectedSlug) setSelectedSlug(list[0].slug);
    }
    if (docRes.ok) {
      const j = await docRes.json();
      setDocuments(j.documents ?? []);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(file: File) {
    if (!selectedSlug) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("categorySlug", selectedSlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/documents-by-category/upload`, { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Yükleme başarısız");
      return;
    }
    load();
  }

  const docsBySlug = documents
    .filter((d) => d.categorySlug)
    .reduce((acc, d) => {
      if (!acc[d.categorySlug]) acc[d.categorySlug] = [];
      acc[d.categorySlug].push(d);
      return acc;
    }, {} as Record<string, Doc[]>);

  if (loading) return null;
  if (categories.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 sm:mb-8">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Operasyon belgeleri</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Öğrenci dosyasına operasyon belgesi yükleyin. Öğrenci Dökümanlar sayfasından görüp indirebilir.</p>
      </div>
      <div className="p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 mb-6">
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kategori</label>
            <select
              value={selectedSlug || categories[0]?.slug || ""}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
              id="op-doc-file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
              disabled={uploading}
            />
            <label
              htmlFor="op-doc-file"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-50"
            >
              <span className="material-icons-outlined text-lg">upload</span>
              {uploading ? "Yükleniyor..." : "Dosya yükle"}
            </label>
          </div>
        </div>
        <div className="space-y-4">
          {categories.map((cat) => {
            const docs = docsBySlug[cat.slug] ?? [];
            if (docs.length === 0) return null;
            return (
              <div key={cat.id}>
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">{cat.name}</h3>
                <ul className="space-y-1.5">
                  {docs.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <a href={`/api/students/${studentId}/documents-by-category/${d.id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                        {d.fileName}
                      </a>
                      <span className="text-xs text-slate-500">v{d.version} · {new Date(d.uploadedAt).toLocaleDateString("tr-TR")}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDocumentStatusBadgeClass(d.status)}`}>
                        {getDocumentStatusLabel(d.status)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
