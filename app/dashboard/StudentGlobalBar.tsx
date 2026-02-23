"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatAgo } from "@/lib/utils";

type Student = {
  id: string;
  gmailConnection: { status: string } | null;
};

type Task = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  linkHref: string | null;
  readAt: string | null;
  createdAt: string;
};

function buildTasks(gmailConnected: boolean): Task[] {
  return [
    { id: "gmail", label: "Gmail hesabını bağla", done: gmailConnected, href: "/dashboard/settings" },
    { id: "card", label: "Başvuru kartını doldur", done: false, href: "/dashboard/profilim" },
  ];
}

export function StudentGlobalBar({
  user,
  student,
  onSignOutClick,
  compact = false,
}: {
  user: { name?: string | null; email?: string | null };
  student: Student;
  onSignOutClick: () => void;
  compact?: boolean;
}) {
  const gmailConnected = student.gmailConnection?.status === "connected";
  const tasks = buildTasks(gmailConnected);
  const pendingTasks = tasks.filter((t) => !t.done).length;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me/notifications", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications ?? []))
      .catch(() => setNotifications([]));
  }, []);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const badgeCount = unreadCount + pendingTasks;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notifRef.current && !notifRef.current.contains(e.target as Node) &&
        profileRef.current && !profileRef.current.contains(e.target as Node)
      ) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(n: Notification) {
    if (n.readAt) return;
    await fetch(`/api/me/notifications/${n.id}`, { method: "PATCH", credentials: "include" });
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
    );
  }

  async function markAllRead() {
    await fetch("/api/me/notifications/read-all", { method: "POST", credentials: "include" });
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  return (
    <div className="h-14 shrink-0 flex items-center justify-end gap-1 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => { setNotifOpen((o) => !o); setProfileOpen(false); }}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          aria-label="Bildirimler"
          aria-expanded={notifOpen}
        >
          <span className="material-icons-outlined text-xl">notifications</span>
          {badgeCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 && pendingTasks === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">Bildirim yok</li>
              ) : (
                <>
                  {notifications.map((n) => {
                    const href = n.linkHref || "#";
                    return (
                      <li
                        key={n.id}
                        className={`px-4 py-3 ${!n.readAt ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                      >
                        <Link
                          href={href}
                          onClick={() => {
                            markRead(n);
                            setNotifOpen(false);
                          }}
                          className="block"
                        >
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{n.title}</p>
                          {n.message && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{n.message}</p>}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatAgo(n.createdAt)}
                            {!n.readAt && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary" aria-hidden />}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                  {pendingTasks > 0 && (
                    <li className="px-4 py-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Yapman gerekenler</p>
                      {tasks.map((t) =>
                        t.done ? (
                          <div key={t.id} className="px-2 py-2 flex items-center gap-2">
                            <span className="material-icons-outlined text-emerald-500 text-base">check_circle</span>
                            <span className="text-sm text-slate-500 line-through">{t.label}</span>
                          </div>
                        ) : (
                          <Link
                            key={t.id}
                            href={t.href}
                            onClick={() => setNotifOpen(false)}
                            className="block px-2 py-2 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg"
                          >
                            <span className="material-icons-outlined text-amber-500 text-base">info</span>
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.label}</span>
                            <span className="material-icons-outlined text-slate-400 text-base ml-auto">arrow_forward</span>
                          </Link>
                        )
                      )}
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => { setProfileOpen((o) => !o); setNotifOpen(false); }}
          className="flex items-center gap-2 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Profil menüsü"
          aria-expanded={profileOpen}
        >
          <span className="material-icons-outlined text-xl">person</span>
          {!compact && (
            <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
              {user.name ?? user.email ?? "Profil"}
            </span>
          )}
          <span className="material-icons-outlined text-lg">expand_more</span>
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name ?? "Öğrenci"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/dashboard"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="material-icons-outlined text-lg">home</span>
                Ana Sayfa
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="material-icons-outlined text-lg">settings</span>
                Ayarlar
              </Link>
              <button
                type="button"
                onClick={() => { setProfileOpen(false); onSignOutClick(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="material-icons-outlined text-lg">logout</span>
                Çıkış
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
