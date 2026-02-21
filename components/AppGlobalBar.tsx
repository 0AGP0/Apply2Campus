"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SignOutModal } from "./SignOutModal";
import type { AppSidebarUser } from "./AppSidebar";
import { isOperationRole } from "@/lib/roles";
import { ConsultantNotifications } from "./ConsultantNotifications";

type AppGlobalBarProps = {
  user: AppSidebarUser;
  /** Mobil header içinde gömülü kullanım – dış wrapper olmadan */
  embedded?: boolean;
};

export function AppGlobalBar({ user, embedded = false }: AppGlobalBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === "ADMIN";
  const isOperation = isOperationRole(user.role);
  const homeHref = isAdmin ? "/admin" : isOperation ? "/operasyon/inbox" : "/panel";
  const homeLabel = isAdmin ? "Admin paneli" : isOperation ? "Tek Inbox" : "Ana Sayfa";

  const showNotifications = user.role === "CONSULTANT" || isOperation;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const content = (
    <>
      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <div className={`flex items-center justify-end gap-1 ${embedded ? "" : "h-14 shrink-0 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"}`}>
        {showNotifications && (
          <div className="mr-2">
            <ConsultantNotifications compact />
          </div>
        )}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Profil menüsü"
            aria-expanded={profileOpen}
          >
            <span className="material-icons-outlined text-xl">person</span>
            {!embedded && (
              <>
                <span className="hidden sm:inline text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]">
                  {user.name ?? "Kullanıcı"}
                </span>
                <span className="material-icons-outlined text-lg hidden sm:inline">expand_more</span>
              </>
            )}
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name ?? "Kullanıcı"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link
                  href={homeHref}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="material-icons-outlined text-lg">home</span>
                  {homeLabel}
                </Link>
                {!isAdmin && (
                  <Link
                    href="/students"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="material-icons-outlined text-lg">people_alt</span>
                    Öğrenci listesi
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); setSignOutOpen(true); }}
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
    </>
  );

  return content;
}
