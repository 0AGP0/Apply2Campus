"use client";

import { useState, useEffect } from "react";

type Announcement = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
};

/** Duyurular ve etkinlikler kartı — öğrenci ve danışman panellerinde gösterilir. */
export function AnnouncementsCard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetch("/api/announcements", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements ?? []))
      .catch(() => setAnnouncements([]));
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <span className="material-icons-outlined text-primary">event_note</span>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Etkinlikler & Duyurular
        </h2>
      </div>
      {announcements.length === 0 ? (
        <p className="px-4 sm:px-5 py-6 text-sm text-slate-500 dark:text-slate-400 text-center">
          Henüz duyuru yok.
        </p>
      ) : (
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {announcements.map((a) => (
          <li key={a.id} className="px-4 sm:px-5 py-4">
            <span
              className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 ${
                a.type === "ETKINLIK"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {a.type === "ETKINLIK" ? "Etkinlik" : "Duyuru"}
            </span>
            <p className="font-medium text-slate-800 dark:text-slate-100">{a.title}</p>
            {a.body && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {a.body}
              </p>
            )}
            {(a.startDate || a.endDate) && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                {a.startDate && a.endDate
                  ? `${a.startDate} – ${a.endDate}`
                  : a.startDate ?? a.endDate}
              </p>
            )}
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
