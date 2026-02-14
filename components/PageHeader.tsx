"use client";

import Link from "next/link";

type PageHeaderProps = {
  /** Geri linki (örn. /students) */
  backHref?: string;
  backLabel?: string;
  /** Başlık metni veya node */
  title: React.ReactNode;
  /** Alt satır (örn. açıklama veya breadcrumb) */
  subtitle?: React.ReactNode;
  /** Sağ taraf aksiyonlar (buton, menü vb.) */
  actions?: React.ReactNode;
  /** Sticky yap (scroll'da üstte sabit) */
  sticky?: boolean;
  className?: string;
};

/**
 * Sayfa içeriğinin üstündeki başlık satırı. Tüm sayfalarda aynı yükseklik ve stil.
 * Logo/avatar burada değil; AppHeader'da.
 */
export function PageHeader({
  backHref,
  backLabel = "Geri",
  title,
  subtitle,
  actions,
  sticky = false,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`
        bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800
        px-4 sm:px-6 lg:px-8 py-3 sm:py-4
        flex flex-row items-center gap-2 sm:gap-4 min-w-0
        ${sticky ? "sticky top-0 z-40" : ""}
        ${className}
      `}
    >
      {backHref != null && (
        <Link
          href={backHref}
          className="p-2.5 -ml-1 sm:ml-0 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-all shrink-0 touch-manipulation"
          aria-label={backLabel}
        >
          <span className="material-icons-outlined text-lg">arrow_back</span>
        </Link>
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate leading-tight">
          {title}
        </h1>
        {subtitle != null && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {actions != null && (
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
