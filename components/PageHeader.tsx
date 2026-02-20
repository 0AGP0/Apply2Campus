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
 * Sayfa içeriğinin üstündeki başlık satırı. Panel sayfalarında kullanılır.
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
  const isCompact = className.includes("!px-0") || className.includes("px-0");
  return (
    <header
      className={`
        relative overflow-hidden
        bg-white dark:bg-slate-900
        border-b border-slate-200/90 dark:border-slate-700/90
        shadow-sm
        ${isCompact ? "px-0" : "px-3 sm:px-4 lg:px-5"}
        py-4 sm:py-5
        flex flex-row items-center gap-3 sm:gap-5 min-w-0
        ${sticky ? "sticky top-0 z-40" : ""}
        ${className}
      `}
    >
      {/* Sol accent çizgisi */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/70 dark:from-primary dark:to-primary/80"
        aria-hidden
      />

      {backHref != null && (
        <Link
          href={backHref}
          className="relative z-10 flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary transition-colors shrink-0 touch-manipulation"
          aria-label={backLabel}
        >
          <span className="material-icons-outlined text-xl">arrow_back</span>
        </Link>
      )}

      <div className="relative z-10 min-w-0 flex-1 overflow-hidden">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate leading-tight">
          {title}
        </h1>
        {subtitle != null && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions != null && (
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
