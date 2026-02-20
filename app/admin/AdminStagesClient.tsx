"use client";

import { useEffect, useState } from "react";
import { PanelLayout } from "@/components/PanelLayout";

type Stage = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  studentCount?: number;
};

export function AdminStagesClient() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlug, setNewSlug] = useState("");
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  function fetchStages() {
    setLoading(true);
    fetch("/api/admin/stages")
      .then((r) => r.json())
      .then((data) => setStages(data.stages ?? []))
      .catch(() => setStages([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchStages();
  }, []);

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    const slug = newSlug.trim().toLowerCase().replace(/\s+/g, "-");
    const name = newName.trim();
    if (!slug || !name) return;
    setSaving(true);
    const res = await fetch("/api/admin/stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name }),
    });
    setSaving(false);
    if (res.ok) {
      setNewSlug("");
      setNewName("");
      fetchStages();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Eklenemedi");
    }
  }

  function openEdit(stage: Stage) {
    setEditingStage(stage);
    setEditName(stage.name);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStage || !editName.trim()) return;
    setSavingEdit(true);
    const res = await fetch("/api/admin/stages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: editingStage.slug, name: editName.trim() }),
    });
    setSavingEdit(false);
    if (res.ok) {
      setEditingStage(null);
      setEditName("");
      fetchStages();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Güncellenemedi");
    }
  }

  async function deleteStage(stage: Stage) {
    const count = stage.studentCount ?? 0;
    const msg =
      count > 0
        ? `"${stage.name}" aşamasında ${count} öğrenci var. Silerseniz hepsi başka bir aşamaya taşınacak. Silmek istediğinize emin misiniz?`
        : `"${stage.name}" aşamasını silmek istediğinize emin misiniz?`;
    if (!confirm(msg)) return;
    setDeletingSlug(stage.slug);
    const res = await fetch("/api/admin/stages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: stage.slug }),
    });
    setDeletingSlug(null);
    if (res.ok) fetchStages();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Silinemedi");
    }
  }

  return (
    <PanelLayout
      title="Başvuru aşamaları"
      subtitle="Danışmanların öğrencilere atadığı aşamaları buradan düzenleyin. Bir aşama silinirse, o aşamadaki öğrenciler otomatik olarak başka bir aşamaya taşınır."
    >
      <div className="panel-card p-4 sm:p-6 mb-6 mt-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Yeni aşama ekle</h3>
        <form onSubmit={addStage} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Slug (sistem adı)
            </label>
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="örn. interview"
              className="input-panel w-full"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Görünen ad
            </label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="örn. Mülakat"
              className="input-panel w-full"
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary-panel disabled:opacity-50">
            {saving ? "Ekleniyor…" : "Ekle"}
          </button>
        </form>
      </div>

      <div className="panel-card overflow-hidden">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider p-4 sm:p-6 pb-0">
          Mevcut aşamalar
        </h3>
        {loading ? (
          <p className="p-4 sm:p-6 text-slate-500">Yükleniyor…</p>
        ) : stages.length === 0 ? (
          <p className="p-4 sm:p-6 text-slate-500">Henüz aşama yok. Yukarıdan ekleyin.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {stages.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-primary/10 text-primary uppercase">
                    {s.slug}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                  {s.studentCount != null && s.studentCount > 0 && (
                    <span className="text-sm text-slate-500">
                      {s.studentCount} öğrenci
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="text-slate-500 hover:text-primary text-sm font-medium"
                    title="Düzenle"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteStage(s)}
                    disabled={deletingSlug !== null || stages.length <= 1}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    title={stages.length <= 1 ? "Son aşama silinemez" : "Aşamayı sil"}
                  >
                    {deletingSlug === s.slug ? "Siliniyor…" : "Sil"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingStage && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="panel-card-inner w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Aşamayı düzenle</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Slug (sistem adı) değiştirilemez. Sadece görünen adı güncelleyebilirsiniz.
            </p>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={editingStage.slug}
                  disabled
                  className="input-panel w-full bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-80"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Görünen ad
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="örn. Mülakat"
                  className="input-panel w-full"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingStage(null); setEditName(""); }}
                  className="btn-secondary-panel flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary-panel flex-1 disabled:opacity-50"
                >
                  {savingEdit ? "Kaydediliyor…" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
