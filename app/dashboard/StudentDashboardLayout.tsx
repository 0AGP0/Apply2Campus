"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutModal } from "@/components/SignOutModal";

type Student = {
  id: string;
  name: string;
  studentEmail: string | null;
  gmailAddress: string | null;
  stage: string;
  gmailConnection: { status: string; lastSyncAt: Date | null } | null;
};

export function StudentDashboardLayout({
  children,
  user,
  student,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  student: Student;
}) {
  const pathname = usePathname();
  const gmailConnected = student.gmailConnection?.status === "connected";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="p-4 lg:p-6">
        <Link href="/dashboard/inbox" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <span className="material-icons-outlined text-white text-xl">school</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
            Apply2Campus
          </span>
        </Link>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-2">
          Öğrenci Paneli
        </p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <Link href="/dashboard/inbox" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname.startsWith("/dashboard/inbox") ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">inbox</span>
          <span className="font-medium text-sm">Gelen Kutusu</span>
        </Link>
        <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/settings" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">settings</span>
          <span className="font-medium text-sm">Ayarlar</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
            <span className="text-sm font-bold text-primary">{user.name?.slice(0, 2).toUpperCase() ?? "U"}</span>
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{user.name ?? user.email ?? "Öğrenci"}</p>
            <p className="text-xs text-slate-500 truncate">Öğrenci</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="mt-2 block w-full text-left text-xs text-slate-500 hover:text-primary transition-colors"
        >
          Çıkış
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display">
      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col shrink-0">
        <NavContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
        <button type="button" onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" aria-label="Menüyü aç">
          <span className="material-icons-outlined text-2xl">menu</span>
        </button>
        <Link href="/dashboard/inbox" className="flex items-center gap-2 min-w-0">
          <div className="bg-primary p-1 rounded-lg shrink-0">
            <span className="material-icons-outlined text-white text-lg">school</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white truncate">Apply2Campus</span>
        </Link>
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
          <span className="text-xs font-bold text-primary">{user.name?.slice(0, 2).toUpperCase() ?? "U"}</span>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" aria-hidden onClick={() => setMobileMenuOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-white">Menü</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" aria-label="Kapat">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavContent />
            </div>
          </aside>
        </>
      )}

      <main className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
