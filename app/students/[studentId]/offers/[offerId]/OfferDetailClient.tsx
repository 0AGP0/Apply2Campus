"use client";

import { useState, useEffect } from "react";

type OfferItem = {
  id: string;
  city: string;
  schoolName: string;
  program: string;
  programGroup: string | null;
  durationWeeks: number;
  amount: number;
  currency: string | null;
};

type Offer = {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  createdAt: string;
  items: OfferItem[];
  createdBy?: { name: string | null; email: string | null };
};

type CatalogRow = {
  id: string;
  city: string;
  schoolName: string;
  program: string;
  programGrup: string | null;
  priceByDuration: Record<string, number | null>;
  currency: string | null;
};

type EditableOfferItem = {
  city: string;
  schoolName: string;
  program: string;
  programGroup?: string;
  durationWeeks: number;
  amount: number;
  currency?: string;
};

const DURATIONS = [
  { value: 2, label: "2 Hafta" },
  { value: 8, label: "8 Hafta" },
  { value: 12, label: "12 Hafta" },
  { value: 16, label: "16 Hafta" },
  { value: 24, label: "24 Hafta" },
  { value: 32, label: "32 Hafta" },
];

function getAmount(row: CatalogRow, durationWeeks: number): number | null {
  return row.priceByDuration[String(durationWeeks)] ?? null;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  VIEWED: "Görüntülendi",
  ACCEPTED: "Kabul edildi",
  REJECTED: "Reddedildi",
  REVISION_REQUESTED: "Revizyon istendi",
};

export function OfferDetailClient({
  studentId,
  offer,
  isStudent,
}: {
  studentId: string;
  offer: Offer;
  isStudent: boolean;
}) {
  const canRespond = isStudent && !["ACCEPTED", "REJECTED"].includes(offer.status);
  const canEditAndResend = !isStudent && (offer.status === "DRAFT" || offer.status === "REVISION_REQUESTED");
  const [editModalOpen, setEditModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
            {STATUS_LABEL[offer.status] ?? offer.status}
          </span>
          {offer.sentAt && (
            <span className="text-sm text-slate-500">Gönderilme: {new Date(offer.sentAt).toLocaleDateString("tr-TR")}</span>
          )}
        </div>
        {offer.summary && <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{offer.summary}</p>}
        {offer.body && <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 mb-4">{offer.body}</div>}

        {offer.items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">Kalemler</h4>
            <ul className="space-y-2">
              {offer.items.map((i) => (
                <li key={i.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span>{i.city} · {i.schoolName}{i.programGroup ? ` · ${i.programGroup}` : ""} · {i.program} ({i.durationWeeks} hafta)</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{i.amount} {i.currency ?? "€"}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              Toplam: {offer.items.reduce((s, i) => s + i.amount, 0).toFixed(2)} {offer.items[0]?.currency ?? "€"}
            </p>
          </div>
        )}

        {offer.respondedAt && offer.responseNote && (
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Öğrenci notu</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{offer.responseNote}</p>
          </div>
        )}

        {canEditAndResend && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <span className="material-icons-outlined text-lg">edit</span>
              {offer.status === "REVISION_REQUESTED" ? "Revizyonu düzenle ve tekrar gönder" : "Düzenle ve gönder"}
            </button>
          </div>
        )}

        {canRespond && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
            <RespondButtons studentId={studentId} offerId={offer.id} onSuccess={() => window.location.reload()} />
          </div>
        )}
      </div>

      {editModalOpen && (
        <EditOfferModal
          studentId={studentId}
          offerId={offer.id}
          offer={offer}
          onClose={() => setEditModalOpen(false)}
          onSaved={() => {
            setEditModalOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function RespondButtons({
  studentId,
  offerId,
  onSuccess,
}: {
  studentId: string;
  offerId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState<string | null>(null);

  async function respond(status: string) {
    setLoading(true);
    const res = await fetch(`/api/students/${studentId}/offers/${offerId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: note || undefined }),
    });
    setLoading(false);
    if (res.ok) onSuccess();
    else alert("İşlem başarısız.");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => respond("ACCEPTED")}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        Kabul et
      </button>
      <button
        type="button"
        onClick={() => setShowNote("REJECTED")}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
      >
        Reddet
      </button>
      <button
        type="button"
        onClick={() => setShowNote("REVISION_REQUESTED")}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
      >
        Revizyon iste
      </button>
      {showNote && (
        <div className="w-full mt-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Not (isteğe bağlı)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => respond(showNote)}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium"
            >
              Gönder
            </button>
            <button type="button" onClick={() => setShowNote(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm">
              İptal
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function EditOfferModal({
  studentId,
  offerId,
  offer,
  onClose,
  onSaved,
}: {
  studentId: string;
  offerId: string;
  offer: Offer;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(offer.title);
  const [summary, setSummary] = useState(offer.summary ?? "");
  const [items, setItems] = useState<EditableOfferItem[]>(
    offer.items.map((i) => ({
      city: i.city,
      schoolName: i.schoolName,
      program: i.program,
      programGroup: i.programGroup ?? undefined,
      durationWeeks: i.durationWeeks,
      amount: i.amount,
      currency: i.currency ?? undefined,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "addItem">("form");
  const [catalog, setCatalog] = useState<{
    countries: string[];
    byCountry: Record<string, { cities: string[]; byCity: Record<string, CatalogRow[]> }>;
  }>({ countries: [], byCountry: {} });
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [selectedDuration, setSelectedDuration] = useState(2);

  useEffect(() => {
    fetch("/api/germany-offers")
      .then((r) => r.json())
      .then((d) => setCatalog({ countries: d.countries ?? [], byCountry: d.byCountry ?? {} }))
      .catch(() => setCatalog({ countries: [], byCountry: {} }));
  }, []);

  const countryData = selectedCountry ? catalog.byCountry[selectedCountry] : null;
  const cities = countryData?.cities ?? [];
  const rows = selectedCountry && selectedCity && countryData?.byCity ? (countryData.byCity[selectedCity] ?? []) : [];
  const byProgramGrup = rows.reduce<Record<string, CatalogRow[]>>((acc, r) => {
    const key = r.programGrup || "(Grup yok)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});
  const selectedRows = rows.filter((r) => selectedRowIds.has(r.id));
  const canAddSelected = selectedRows.length > 0 && selectedRows.every((r) => getAmount(r, selectedDuration) != null);

  function toggleRow(rowId: string) {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function addSelectedItems() {
    if (!canAddSelected) return;
    const newItems: EditableOfferItem[] = selectedRows.map((row) => {
      const amt = getAmount(row, selectedDuration)!;
      return {
        city: row.city,
        schoolName: row.schoolName,
        program: row.program,
        programGroup: row.programGrup ?? undefined,
        durationWeeks: selectedDuration,
        amount: amt,
        currency: row.currency ?? undefined,
      };
    });
    setItems((prev) => [...prev, ...newItems]);
    setSelectedRowIds(new Set());
    setStep("form");
  }

  async function submitResend() {
    if (!title.trim()) {
      setError("Başlık girin.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        summary: summary.trim() || undefined,
        items: items.length > 0 ? items : undefined,
        status: "SENT",
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Güncellenemedi.");
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Revizyonu düzenle ve tekrar gönder</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {step === "form" ? (
            <>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">{error}</p>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Başlık *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Özet (isteğe bağlı)</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kalemler</label>
                    <button type="button" onClick={() => setStep("addItem")} className="text-sm font-medium text-primary hover:underline">
                      + Kalem ekle
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">Henüz kalem yok. İsteğe bağlı.</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it, i) => (
                        <li key={i} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                          <span>{it.city} · {it.schoolName}{it.programGroup ? ` · ${it.programGroup}` : ""} · {it.program} ({it.durationWeeks} hf) · {it.amount} {it.currency ?? "€"}</span>
                          <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-red-500 hover:underline">
                            Kaldır
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Ülke ve şehir seçin, program(lar) ve süre seçip ekleyin.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Süre (seçilen tüm programlar için)</label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ülke</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity(""); setSelectedRowIds(new Set()); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value="">Seçin</option>
                    {catalog.countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {selectedCountry && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Şehir</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => { setSelectedCity(e.target.value); setSelectedRowIds(new Set()); }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seçin</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedCountry && selectedCity && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program (birden fazla seçebilirsiniz)</label>
                    <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-600 rounded-xl p-2">
                      {Object.entries(byProgramGrup).map(([grup, list]) => (
                        <div key={grup}>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{grup}</p>
                          {list.map((row) => {
                            const amt = getAmount(row, selectedDuration);
                            const hasPrice = amt != null;
                            return (
                              <label key={row.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedRowIds.has(row.id)}
                                  onChange={() => toggleRow(row.id)}
                                  disabled={!hasPrice}
                                  className="text-primary rounded"
                                />
                                <span className="text-sm">{row.program}</span>
                                {hasPrice && <span className="text-xs text-slate-500">({amt} {row.currency ?? "€"})</span>}
                                {!hasPrice && <span className="text-xs text-amber-600">(bu süre için fiyat yok)</span>}
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    {selectedRows.length > 0 && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        {selectedRows.length} program seçildi.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {step === "addItem" ? (
            <>
              <button type="button" onClick={() => setStep("form")} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium">
                Geri
              </button>
              <button
                type="button"
                onClick={addSelectedItems}
                disabled={!canAddSelected}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                Seçilenleri ekle ({selectedRows.length})
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium">
                İptal
              </button>
              <button
                type="button"
                onClick={submitResend}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Gönderiliyor…" : "Tekrar gönder"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
