"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar, type AppSidebarUser } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export type AppLayoutUser = AppSidebarUser;

type AppLayoutProps = {
  children: React.ReactNode;
  user: AppLayoutUser;
};

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display">
      {/* Desktop sidebar — sabit yükseklik, içerik uzasa da kaymaz */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:h-screen lg:overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <AppSidebar user={user} pathname={pathname ?? ""} />
      </aside>

      {/* Mobil üst çubuk — tüm sayfalarda aynı */}
      <AppHeader user={user} onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile menu overlay + drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
            aria-hidden
            onClick={closeMobileMenu}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-xl">
            <AppSidebar
              user={user}
              pathname={pathname ?? ""}
              onNavigate={closeMobileMenu}
              variant="drawer"
            />
          </aside>
        </>
      )}

      <main className="flex-1 min-h-0 min-w-0 overflow-y-auto flex flex-col bg-gradient-to-b from-slate-50/90 to-slate-100/80 dark:from-slate-950/90 dark:to-slate-900/80 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
