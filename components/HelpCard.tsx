"use client";

import { useState, useCallback } from "react";

type Consultant = {
  id: string;
  name: string | null;
  image: string | null;
  email?: string;
};

type Slot = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  available: boolean;
  pendingCount?: number;
};

type HelpCardProps = {
  consultant: Consultant | null;
  consultantDescription?: string;
};

export function HelpCard({ consultant, consultantDescription = "Sorularınız için eğitim danışmanınızla görüşme talebi oluşturabilirsiniz." }: HelpCardProps) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadSlots = useCallback(async () => {
    if (!consultant) return;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const to = new Date(from);
      to.setDate(to.getDate() + 13);
      const fromStr = from.toISOString().slice(0, 10);
      const toStr = to.toISOString().slice(0, 10);
      const res = await fetch(`/api/consultants/${consultant.id}/slots?from=${fromStr}&to=${toStr}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Slotlar yüklenemedi");
      setSlots(data.slots ?? []);
      setSuccess(false);
      setSelectedSlot(null);
      setNote("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Slotlar yüklenemedi");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [consultant]);

  const openModal = () => {
    if (!consultant) return;
    setOpen(true);
    loadSlots();
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !selectedSlot.available) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/me/appointment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: selectedSlot.id, note: note.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Talep gönderilemedi");
      setSuccess(true);
      setSelectedSlot(null);
      loadSlots();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Talep gönderilemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setOpen(false);
    setError(null);
    setSuccess(false);
    setSelectedSlot(null);
    setNote("");
  };

  if (!consultant) return null;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
      >
        <div className="flex gap-4">
          <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            {consultant.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={consultant.image} alt="" width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <span className="material-icons-outlined text-slate-400 text-2xl">person</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">
              Yardıma ihtiyacın mı var?
            </h3>
            <p className="text-sm font-medium text-primary">{consultant.name ?? "Eğitim Danışmanı"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {consultantDescription}
            </p>
            <span className="inline-flex items-center gap-1 mt-2 text-sm text-primary font-medium">
              Görüşme talebi oluştur
              <span className="material-icons-outlined text-lg">arrow_forward</span>
            </span>
          </div>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
        >
          <div
            className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {consultant.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={consultant.image} alt="" width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <span className="material-icons-outlined text-slate-400">person</span>
                )}
              </div>
              <div>
                <h2 id="help-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                  {consultant.name ?? "Danışman"} ile görüşme talebi
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Müsait bir slot seçin</p>
              </div>
            </div>

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
                <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
                <span className="text-sm text-emerald-800 dark:text-emerald-200">Talep gönderildi. Danışmanınız onayladığında bildirim alacaksınız.</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-2">
                <span className="material-icons-outlined text-red-600 dark:text-red-400">error</span>
                <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <span className="material-icons-outlined animate-spin text-3xl text-slate-400">refresh</span>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {slots.filter((s) => s.available).length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
                      Bu tarih aralığında müsait slot bulunmuyor. Danışmanınızla iletişime geçebilirsiniz.
                    </p>
                  ) : (
                    slots
                      .filter((s) => s.available)
                      .map((s) => {
                        const dateObj = new Date(s.slotDate + "T12:00:00");
                        const dayName = dateObj.toLocaleDateString("tr-TR", { weekday: "short" });
                        const dateStr = dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
                        const isSelected = selectedSlot?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <span className="font-medium">{dayName}, {dateStr}</span> · {s.startTime}–{s.endTime}
                          </button>
                        );
                      })
                  )}
                </div>

                {selectedSlot && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Not (isteğe bağlı)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Görüşmek istediğiniz konu..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Kapat
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!selectedSlot || submitting}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? "Gönderiliyor…" : "Talep gönder"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
