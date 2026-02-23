"use client";

import { useState, useEffect, useCallback } from "react";

type Announcement = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  sortOrder: number;
  targetAudience?: string;
  createdAt: string;
};

type TargetAudience = "STUDENTS" | "CONSULTANTS" | "ALL";

export function AdminDuyurularClient() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"DUYURU" | "ETKINLIK">("DUYURU");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAudience, setTargetAudience] = useState<TargetAudience>("ALL");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setEditItem(null);
    setTitle("");
    setBody("");
    setStartDate("");
    setEndDate("");
    setTargetAudience("ALL");
    setActive(true);
  }

  const add = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          title: title.trim(),
          body: body.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          targetAudience,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        resetForm();
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Eklenemedi (${res.status})`);
      }
    } catch (e) {
      alert("Bağlantı hatası. Sunucuya ulaşılamıyor olabilir.");
    } finally {
      setSubmitting(false);
    }
  };

  const update = async () => {
    if (!editItem || !title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/announcements/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type,
          title: title.trim(),
          body: body.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          targetAudience,
          active,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        resetForm();
        load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Güncellenemedi (${res.status})`);
      }
    } catch (e) {
      alert("Bağlantı hatası. Sunucuya ulaşılamıyor olabilir.");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`"${a.title}" duyurusunu silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/admin/announcements/${a.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) load();
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? "Silinemedi.");
      }
    } catch (e) {
      alert("Bağlantı hatası.");
    }
  };

  const openEdit = (a: Announcement) => {
    setEditItem(a);
    setTitle(a.title);
    setBody(a.body ?? "");
    setType((a.type === "ETKINLIK" ? "ETKINLIK" : "DUYURU") as "DUYURU" | "ETKINLIK");
    setStartDate(a.startDate ?? "");
    setEndDate(a.endDate ?? "");
    setTargetAudience((a.targetAudience ?? "ALL") as TargetAudience);
    setActive(a.active ?? true);
    setModalOpen(true);
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Yükleniyor…</div>;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
        >
          <span className="material-icons-outlined text-lg">add</span>
          Duyuru / Etkinlik ekle
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">Henüz duyuru yok. Yukarıdan ekleyebilirsiniz.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${a.type === "ETKINLIK" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                      {a.type === "ETKINLIK" ? "Etkinlik" : "Duyuru"}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {a.targetAudience === "STUDENTS" ? "Öğrenciler" : a.targetAudience === "CONSULTANTS" ? "Danışmanlar" : "Herkes"}
                    </span>
                    {!a.active && <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700">Pasif</span>}
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white mt-1">{a.title}</h3>
                  {a.body && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{a.body}</p>}
                  {(a.startDate || a.endDate) && (
                    <p className="text-xs text-slate-500 mt-2">{a.startDate ?? ""} {a.startDate && a.endDate ? "–" : ""} {a.endDate ?? ""}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => openEdit(a)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary" title="Düzenle">
                    <span className="material-icons-outlined text-lg">edit</span>
                  </button>
                  <button type="button" onClick={() => remove(a)} className="p-2 rounded-lg text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600" title="Sil">
                    <span className="material-icons-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              {editItem ? "Duyuru düzenle" : "Duyuru / Etkinlik ekle"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tür</label>
                <select value={type} onChange={(e) => setType(e.target.value as "DUYURU" | "ETKINLIK")} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm">
                  <option value="DUYURU">Duyuru</option>
                  <option value="ETKINLIK">Etkinlik</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hedef kitle</label>
                <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value as TargetAudience)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm">
                  <option value="ALL">Herkes (öğrenci + danışman)</option>
                  <option value="STUDENTS">Sadece öğrenciler</option>
                  <option value="CONSULTANTS">Sadece danışmanlar</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Başlık *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" placeholder="Başlık" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">İçerik</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" placeholder="Açıklama (isteğe bağlı)" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Başlangıç</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bitiş</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
                </div>
              </div>
              {editItem && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-slate-300" />
                  <label htmlFor="active" className="text-sm text-slate-700 dark:text-slate-300">Aktif (göster)</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">İptal</button>
              <button
                type="button"
                onClick={editItem ? update : add}
                disabled={submitting || !title.trim()}
                className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? (editItem ? "Kaydediliyor…" : "Ekleniyor…") : editItem ? "Kaydet" : "Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
