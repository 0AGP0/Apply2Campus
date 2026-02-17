"use client";

import { useState, useEffect } from "react";

/** Katalog ürünü (attribute tabanlı: süre → fiyat). */
type CatalogRow = {
  id: string;
  city: string;
  schoolName: string;
  program: string;
  programGrup: string | null;
  priceByDuration: Record<string, number | null>;
  currency: string | null;
};

type OfferItem = {
  city: string;
  schoolName: string;
  program: string;
  programGroup?: string;
  durationWeeks: number;
  amount: number;
  currency?: string;
};

type Offer = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  createdAt: string;
  items: { city: string; schoolName: string; program: string; programGroup?: string; durationWeeks: number; amount: number; currency?: string }[];
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

export function StudentOffersSection({ studentId }: { studentId: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catalog, setCatalog] = useState<{
    countries: string[];
    byCountry: Record<string, { cities: string[]; byCity: Record<string, CatalogRow[]> }>;
  }>({ countries: [], byCountry: {} });

  const fetchOffers = () => {
    fetch(`/api/students/${studentId}/offers`)
      .then((r) => r.json())
      .then((d) => setOffers(d.offers ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, [studentId]);

  useEffect(() => {
    if (modalOpen) {
      fetch("/api/germany-offers")
        .then((r) => r.json())
        .then((d) => setCatalog({
          countries: d.countries ?? [],
          byCountry: d.byCountry ?? {},
        }))
        .catch(() => setCatalog({ countries: [], byCountry: {} }));
    }
  }, [modalOpen]);

  const statusLabel: Record<string, string> = {
    DRAFT: "Taslak",
    SENT: "Gönderildi",
    VIEWED: "Görüntülendi",
    ACCEPTED: "Kabul edildi",
    REJECTED: "Reddedildi",
    REVISION_REQUESTED: "Revizyon istendi",
  };

  const ACTIVE_STATUSES = ["DRAFT", "SENT", "VIEWED", "REVISION_REQUESTED"];
  const activeOffers = offers.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOffers = offers.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  function OfferRow({ o }: { o: Offer }) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{o.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {statusLabel[o.status] ?? o.status}
            {o.sentAt && ` · Gönderilme: ${new Date(o.sentAt).toLocaleDateString("tr-TR")}`}
            {o.respondedAt && ` · Yanıt: ${new Date(o.respondedAt).toLocaleDateString("tr-TR")}`}
          </p>
        </div>
        <a href={`/students/${studentId}/offers/${o.id}`} className="text-sm font-medium text-primary hover:underline">
          Görüntüle
        </a>
      </li>
    );
  }

  return (
    <>
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="material-icons-outlined text-primary">description</span>
            Teklifler
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">add</span>
            Yeni teklif
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          {loading ? (
            <p className="text-slate-500 text-sm">Yükleniyor…</p>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="material-icons-outlined text-lg text-primary">pending_actions</span>
                  Aktif teklif{activeOffers.length !== 1 ? "ler" : ""}
                </h4>
                {activeOffers.length === 0 ? (
                  <p className="text-slate-500 text-sm py-1">Yanıt bekleyen teklif yok.</p>
                ) : (
                  <ul className="space-y-3">
                    {activeOffers.map((o) => (
                      <OfferRow key={o.id} o={o} />
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="material-icons-outlined text-lg text-slate-500">history</span>
                  Geçmiş teklifler
                </h4>
                {pastOffers.length === 0 ? (
                  <p className="text-slate-500 text-sm py-1">Sonuçlanmış teklif yok.</p>
                ) : (
                  <ul className="space-y-3">
                    {pastOffers.map((o) => (
                      <OfferRow key={o.id} o={o} />
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {modalOpen && (
        <OfferFormModal
          studentId={studentId}
          catalog={catalog}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchOffers();
          }}
        />
      )}
    </>
  );
}

function OfferFormModal({
  studentId,
  catalog,
  onClose,
  onSaved,
}: {
  studentId: string;
  catalog: { countries: string[]; byCountry: Record<string, { cities: string[]; byCity: Record<string, CatalogRow[]> }> };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<OfferItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "addItem">("form");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [selectedDuration, setSelectedDuration] = useState(2);

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
    const newItems: OfferItem[] = selectedRows.map((row) => {
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

  async function submit(send: boolean) {
    if (!title.trim()) {
      setError("Başlık girin.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        summary: summary.trim() || undefined,
        items: items.length > 0 ? items : undefined,
        status: send ? "SENT" : "DRAFT",
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Kaydedilemedi.");
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Yeni teklif</h3>
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
                    placeholder="Örn. 2025 Berlin Yoğun Almanca Paketi"
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kalemler (katalogdan)</label>
                    <button
                      type="button"
                      onClick={() => setStep("addItem")}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      + Kalem ekle
                    </button>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">Henüz kalem eklenmedi. İsteğe bağlı.</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it, i) => (
                        <li key={i} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                          <span>{it.city} · {it.schoolName}{it.programGroup ? ` · ${it.programGroup}` : ""} · {it.program} ({it.durationWeeks} hf) · {it.amount} {it.currency ?? "€"}</span>
                          <button
                            type="button"
                            onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                            className="text-red-500 hover:underline"
                          >
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Ülke ve şehir seçin, ardından program ve süre seçip ekleyin.</p>
              <div className="space-y-4">
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
                  <>
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
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program grubu / Program (birden fazla seçebilirsiniz)</label>
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
                          {selectedRows.length} program seçildi. Seçilen süre: {DURATIONS.find((d) => d.value === selectedDuration)?.label ?? selectedDuration} hafta.
                        </p>
                      )}
                    </div>
                  </>
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
                onClick={() => submit(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Taslak kaydet"}
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Gönderiliyor…" : "Gönder"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
