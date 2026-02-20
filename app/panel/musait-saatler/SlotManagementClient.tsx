"use client";

import { useState, useEffect, useCallback } from "react";

type Slot = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  available: boolean;
  pendingCount?: number;
};

type AppointmentRequest = {
  id: string;
  slotId: string;
  studentId: string;
  status: string;
  note: string | null;
  slotDate: string;
  startTime: string;
  endTime: string;
  student: { id: string; name: string };
};

export function SlotManagementClient({ consultantId }: { consultantId: string }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [slotDate, setSlotDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("09:30");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const to = new Date(from);
      to.setDate(to.getDate() + 59);
      const fromStr = from.toISOString().slice(0, 10);
      const toStr = to.toISOString().slice(0, 10);

      const [slotsRes, requestsRes] = await Promise.all([
        fetch(`/api/consultants/${consultantId}/slots?from=${fromStr}&to=${toStr}`),
        fetch("/api/me/appointment-requests"),
      ]);

      const slotsData = await slotsRes.json();
      const requestsData = await requestsRes.json();

      if (!slotsRes.ok) throw new Error(slotsData.error ?? "Slotlar yüklenemedi");
      if (!requestsRes.ok) throw new Error(requestsData.error ?? "Talepler yüklenemedi");

      setSlots(slotsData.slots ?? []);
      setRequests(requestsData.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
      setSlots([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [consultantId]);

  useEffect(() => {
    load();
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    setSlotDate(dateStr);
  }, [load]);

  const handleAddSlot = async () => {
    if (!slotDate || !startTime || !endTime) {
      setSubmitError("Tarih ve saatleri girin");
      return;
    }
    setAdding(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/consultants/${consultantId}/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotDate, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Slot eklenemedi");
      await load();
      setSlotDate(new Date().toISOString().slice(0, 10));
      setStartTime("09:00");
      setEndTime("09:30");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Slot eklenemedi");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm("Bu slotu silmek istediğinize emin misiniz? Bekleyen talepler iptal edilecek.")) return;
    try {
      const res = await fetch(`/api/consultants/${consultantId}/slots/${slotId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Slot silinemedi");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Slot silinemedi");
    }
  };

  const handleRequestAction = async (requestId: string, status: "CONFIRMED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/me/appointment-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "İşlem başarısız");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "İşlem başarısız");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const confirmedRequests = requests.filter((r) => r.status === "CONFIRMED");

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <span className="material-icons-outlined animate-spin text-3xl text-slate-400">refresh</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-2">
          <span className="material-icons-outlined text-red-600 dark:text-red-400">error</span>
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      {/* Slot ekleme */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons-outlined text-primary">add_circle</span>
          Yeni slot ekle
        </h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tarih</label>
            <input
              type="date"
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Başlangıç (HH:mm)</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Bitiş (HH:mm)</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddSlot}
            disabled={adding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {adding ? (
              <>
                <span className="material-icons-outlined animate-spin text-lg">refresh</span>
                Ekleniyor…
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-lg">add</span>
                Ekle
              </>
            )}
          </button>
        </div>
        {submitError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{submitError}</p>}
      </div>

      {/* Bekleyen talepler */}
      {pendingRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-amber-600">schedule</span>
            Bekleyen görüşme talepleri ({pendingRequests.length})
          </h3>
          <ul className="space-y-3">
            {pendingRequests.map((r) => {
              const dateObj = new Date(r.slotDate + "T12:00:00");
              const dateStr = dateObj.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
              return (
                <li
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{r.student.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {dateStr} · {r.startTime}–{r.endTime}
                    </p>
                    {r.note && <p className="text-xs text-slate-500 mt-1">{r.note}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRequestAction(r.id, "CONFIRMED")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestAction(r.id, "REJECTED")}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Reddet
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Slot listesi */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-icons-outlined text-primary">event</span>
          Eklediğiniz slotlar ({slots.length})
        </h3>
        {slots.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
            Henüz slot eklemediniz. Yukarıdan tarih ve saat girerek slot ekleyebilirsiniz.
          </p>
        ) : (
          <ul className="space-y-2 max-h-80 overflow-y-auto">
            {slots.map((s) => {
              const dateObj = new Date(s.slotDate + "T12:00:00");
              const dateStr = dateObj.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
              const hasConfirmed = !s.available;
              return (
                <li
                  key={s.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
                    hasConfirmed
                      ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800 dark:text-white">{dateStr}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">{s.startTime}–{s.endTime}</span>
                    {s.pendingCount && s.pendingCount > 0 && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                        ({s.pendingCount} bekleyen talep)
                      </span>
                    )}
                    {hasConfirmed && (
                      <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">Onaylı randevu</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(s.id)}
                    disabled={hasConfirmed}
                    className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={hasConfirmed ? "Onaylı randevusu olan slot silinemez" : "Slotu sil"}
                  >
                    <span className="material-icons-outlined text-lg">delete</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Onaylanan randevular */}
      {confirmedRequests.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-emerald-600">check_circle</span>
            Onaylanan randevular ({confirmedRequests.length})
          </h3>
          <ul className="space-y-2">
            {confirmedRequests.map((r) => {
              const dateObj = new Date(r.slotDate + "T12:00:00");
              const dateStr = dateObj.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">{r.student.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {dateStr} · {r.startTime}–{r.endTime}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    Onaylandı
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
