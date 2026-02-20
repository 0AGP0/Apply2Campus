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
  createdAt: string;
};

export function AdminDuyurularClient() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<"DUYURU" | "ETKINLIK">("DUYURU");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  const add = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          body: body.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        setTitle("");
        setBody("");
        setStartDate("");
        setEndDate("");
        load();
      } else {
        const d = await res.json();
        alert(d.error ?? "Eklenemedi");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Yükleniyor…</div>;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
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
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${a.type === "ETKINLIK" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                    {a.type === "ETKINLIK" ? "Etkinlik" : "Duyuru"}
                  </span>
                  <h3 className="font-semibold text-slate-800 dark:text-white mt-1">{a.title}</h3>
                  {a.body && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{a.body}</p>}
                  {(a.startDate || a.endDate) && (
                    <p className="text-xs text-slate-500 mt-2">{a.startDate ?? ""} {a.startDate && a.endDate ? "–" : ""} {a.endDate ?? ""}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Duyuru / Etkinlik ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tür</label>
                <select value={type} onChange={(e) => setType(e.target.value as "DUYURU" | "ETKINLIK")} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm">
                  <option value="DUYURU">Duyuru</option>
                  <option value="ETKINLIK">Etkinlik</option>
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
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">İptal</button>
              <button type="button" onClick={add} disabled={submitting || !title.trim()} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{submitting ? "Ekleniyor…" : "Ekle"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
