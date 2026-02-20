"use client";

import { useState, useEffect, useCallback } from "react";

const STATUS_OPTIONS = [
  { value: "BASVURU_YAPILDI", label: "Başvuru yapıldı" },
  { value: "KABUL_BEKLENIYOR", label: "Kabul bekleniyor" },
  { value: "KABUL_ALINDI", label: "Kabul alındı" },
  { value: "REDDEDILDI", label: "Reddedildi" },
];

type Application = {
  id: string;
  universityName: string;
  program: string | null;
  applicationDate: string | null;
  status: string;
  notes: string | null;
  secondInstallmentAmount: number | null;
  secondInstallmentDueDate: string | null;
  acceptanceDocument: { id: string; fileName: string; status: string } | null;
};

type DocByCat = {
  id: string;
  categorySlug: string;
  categoryName: string;
  fileName: string;
  status: string;
};

export function BasvurularSection({ studentId }: { studentId: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [acceptanceDocs, setAcceptanceDocs] = useState<DocByCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    universityName: "",
    program: "",
    applicationDate: "",
    status: "BASVURU_YAPILDI",
    notes: "",
    acceptanceDocumentId: "",
    secondInstallmentAmount: "",
    secondInstallmentDueDate: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [appRes, docRes] = await Promise.all([
      fetch(`/api/students/${studentId}/applications`),
      fetch(`/api/students/${studentId}/documents-by-category`),
    ]);
    if (appRes.ok) {
      const j = await appRes.json();
      setApplications(j.applications ?? []);
    }
    if (docRes.ok) {
      const j = await docRes.json();
      const docs = j.documents ?? [];
      setAcceptanceDocs(docs.filter((d: DocByCat) => d.categorySlug === "universite_kabulu"));
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditId(null);
    setForm({
      universityName: "",
      program: "",
      applicationDate: "",
      status: "BASVURU_YAPILDI",
      notes: "",
      acceptanceDocumentId: "",
      secondInstallmentAmount: "",
      secondInstallmentDueDate: "",
    });
    setModalOpen(true);
  }

  function openEdit(app: Application) {
    setEditId(app.id);
    setForm({
      universityName: app.universityName,
      program: app.program ?? "",
      applicationDate: app.applicationDate?.slice(0, 10) ?? "",
      status: app.status,
      notes: app.notes ?? "",
      acceptanceDocumentId: app.acceptanceDocument?.id ?? "",
      secondInstallmentAmount: app.secondInstallmentAmount != null ? String(app.secondInstallmentAmount) : "",
      secondInstallmentDueDate: app.secondInstallmentDueDate?.slice(0, 10) ?? "",
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.universityName.trim()) return;
    setSaving(true);
    const payload = {
      universityName: form.universityName.trim(),
      program: form.program.trim() || null,
      applicationDate: form.applicationDate || null,
      status: form.status,
      notes: form.notes.trim() || null,
      acceptanceDocumentId: form.acceptanceDocumentId || null,
      secondInstallmentAmount: form.secondInstallmentAmount ? Number(form.secondInstallmentAmount) : null,
      secondInstallmentDueDate: form.secondInstallmentDueDate || null,
    };
    const url = editId
      ? `/api/students/${studentId}/applications/${editId}`
      : `/api/students/${studentId}/applications`;
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu başvuruyu silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/students/${studentId}/applications/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  return (
    <section className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Başvurular</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
        >
          <span className="material-icons-outlined text-lg">add</span>
          Başvuru ekle
        </button>
      </div>

      {applications.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm py-6">
          Henüz başvuru eklenmedi. &quot;Başvuru ekle&quot; ile üniversite başvurusu ekleyin.
        </p>
      ) : (
        <ul className="space-y-4">
          {applications.map((app) => (
            <li
              key={app.id}
              className="flex flex-wrap items-start justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
            >
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white">{app.universityName}</p>
                {app.program && <p className="text-sm text-slate-600 dark:text-slate-400">{app.program}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500">
                  {app.applicationDate && (
                    <span>Başvuru: {new Date(app.applicationDate).toLocaleDateString("tr-TR")}</span>
                  )}
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      app.status === "KABUL_ALINDI"
                        ? "bg-emerald-100 text-emerald-700"
                        : app.status === "REDDEDILDI"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {STATUS_OPTIONS.find((o) => o.value === app.status)?.label ?? app.status}
                  </span>
                </div>
                {app.acceptanceDocument && (app.secondInstallmentAmount != null || app.secondInstallmentDueDate) && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-primary">2. Taksit</span>
                    {app.secondInstallmentAmount != null && (
                      <span className="ml-1">{app.secondInstallmentAmount.toLocaleString("tr-TR")} €</span>
                    )}
                    {app.secondInstallmentDueDate && (
                      <span className="text-slate-500 ml-2">
                        Son ödeme: {new Date(app.secondInstallmentDueDate).toLocaleDateString("tr-TR")}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(app)}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg"
                  aria-label="Düzenle"
                >
                  <span className="material-icons-outlined text-lg">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(app.id)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  aria-label="Sil"
                >
                  <span className="material-icons-outlined text-lg">delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {editId ? "Başvuru düzenle" : "Başvuru ekle"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Üniversite *</label>
                <input
                  type="text"
                  value={form.universityName}
                  onChange={(e) => setForm((p) => ({ ...p, universityName: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Üniversite adı"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program</label>
                <input
                  type="text"
                  value={form.program}
                  onChange={(e) => setForm((p) => ({ ...p, program: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Program / bölüm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Başvuru tarihi</label>
                <input
                  type="date"
                  value={form.applicationDate}
                  onChange={(e) => setForm((p) => ({ ...p, applicationDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Durum</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kabul belgesi</label>
                <select
                  value={form.acceptanceDocumentId}
                  onChange={(e) => setForm((p) => ({ ...p, acceptanceDocumentId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="">— Seçin —</option>
                  {acceptanceDocs.map((d) => (
                    <option key={d.id} value={d.id}>{d.fileName}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Üniversite Kabulü belgesini Belgeler sekmesinden yükleyin.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">2. Taksit tutarı (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.secondInstallmentAmount}
                  onChange={(e) => setForm((p) => ({ ...p, secondInstallmentAmount: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Örn: 2500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">2. Taksit son ödeme</label>
                <input
                  type="date"
                  value={form.secondInstallmentDueDate}
                  onChange={(e) => setForm((p) => ({ ...p, secondInstallmentDueDate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                  placeholder="İsteğe bağlı notlar"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
