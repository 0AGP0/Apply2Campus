"use client";

import Link from "next/link";
import type { AppSidebarUser } from "./AppSidebar";
import { isOperationRole } from "@/lib/roles";
import { AppGlobalBar } from "./AppGlobalBar";

type AppHeaderProps = {
  user: AppSidebarUser;
  onMenuClick: () => void;
};

export function AppHeader({ user, onMenuClick }: AppHeaderProps) {
  const isAdmin = user.role === "ADMIN";
  const isOperation = isOperationRole(user.role);
  const logoHref = isAdmin ? "/admin" : isOperation ? "/operasyon/inbox" : "/panel";

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl touch-manipulation transition-colors"
        aria-label="Menüyü aç"
      >
        <span className="material-icons-outlined text-2xl">menu</span>
      </button>
      <Link href={logoHref} className="flex items-center gap-2 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
          <span className="material-icons-outlined text-white text-lg">school</span>
        </div>
        <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white truncate">
          Apply2Campus
        </span>
      </Link>
      <div className="flex items-center gap-1 -mr-1">
        <AppGlobalBar user={user} embedded />
      </div>
    </header>
  );
}
