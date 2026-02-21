"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  studentId: string;
  studentName: string;
  message: string | null;
  readAt: string | null;
  createdAt: string;
};

type ConsultantNotificationsProps = {
  /** Kompakt mod: sadece ikon (üst bar için) */
  compact?: boolean;
};

export function ConsultantNotifications({ compact = false }: ConsultantNotificationsProps) {
  const [list, setList] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!compact) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [compact]);

  const fetchList = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setList(data.notifications ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const unreadCount = list.filter((n) => !n.readAt).length;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setList((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
    );
  }

  function formatAgo(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffM / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffM < 1) return "az önce";
    if (diffM < 60) return `${diffM} dk önce`;
    if (diffH < 24) return `${diffH} sa önce`;
    if (diffD < 7) return `${diffD} gün önce`;
    return d.toLocaleDateString("tr-TR");
  }

  if (loading && list.length === 0 && !compact) return null;

  return (
    <div className="relative" ref={compact ? ref : undefined}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-xl transition-colors ${
          compact
            ? "p-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative"
            : "px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
        aria-expanded={open}
        aria-label="Bildirimler"
      >
        <span className="material-icons-outlined text-xl">notifications</span>
        {!compact && <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Bildirimler</span>}
        {unreadCount > 0 && (
          <span className={`rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center ${
            compact ? "absolute top-1.5 right-1.5 min-w-[1.25rem] h-5 px-1" : "min-w-[1.25rem] h-5 px-1.5"
          }`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-full min-w-[320px] max-w-[400px] max-h-[70vh] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bildirimler</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Tümünü okundu işaretle
                </button>
              )}
            </div>
            <ul className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {list.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Bildirim yok
                </li>
              ) : (
                list.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 transition-colors ${!n.readAt ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <Link
                      href={`/students/${n.studentId}`}
                      onClick={() => {
                        if (!n.readAt) markRead(n.id);
                        setOpen(false);
                      }}
                      className="block"
                    >
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {n.message ?? (n.type === "STUDENT_ASSIGNED" ? "Yeni öğrenci atandı" : "Öğrenci güncellendi")}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatAgo(n.createdAt)}
                        {!n.readAt && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary" aria-hidden />
                        )}
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
