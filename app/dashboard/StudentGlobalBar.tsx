"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

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

function buildTasks(gmailConnected: boolean): Task[] {
  return [
    {
      id: "gmail",
      label: "Gmail hesabını bağla",
      done: gmailConnected,
      href: "/dashboard/settings",
    },
    {
      id: "card",
      label: "Başvuru kartını doldur",
      done: false,
      href: "/dashboard/profilim",
    },
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
  const pendingCount = tasks.filter((t) => !t.done).length;

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Yapman gerekenler</h3>
            </div>
            <ul className="max-h-64 overflow-y-auto">
              {tasks.map((t) => (
                <li key={t.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                  {t.done ? (
                    <div className="px-4 py-3 flex items-center gap-3">
                      <span className="material-icons-outlined text-emerald-500 text-lg">check_circle</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 line-through">{t.label}</span>
                    </div>
                  ) : (
                    <Link
                      href={t.href}
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <span className="material-icons-outlined text-amber-500 text-lg">info</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{t.label}</span>
                      <span className="material-icons-outlined text-slate-400 text-lg ml-auto">arrow_forward</span>
                    </Link>
                  )}
                </li>
              ))}
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
