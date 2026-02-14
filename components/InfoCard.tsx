"use client";

type Variant = "info" | "tip" | "warning" | "neutral";

type InfoCardProps = {
  title: string;
  children: React.ReactNode;
  variant?: Variant;
  icon?: string;
  className?: string;
};

const variantStyles: Record<Variant, { bg: string; border: string; icon: string; title: string }> = {
  info: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800/50",
    icon: "text-blue-600 dark:text-blue-400",
    title: "text-blue-800 dark:text-blue-200",
  },
  tip: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800/50",
    icon: "text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-800 dark:text-emerald-200",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800/50",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-800 dark:text-amber-200",
  },
  neutral: {
    bg: "bg-slate-50 dark:bg-slate-800/60",
    border: "border-slate-200 dark:border-slate-700",
    icon: "text-slate-500 dark:text-slate-400",
    title: "text-slate-700 dark:text-slate-200",
  },
};

const defaultIcons: Record<Variant, string> = {
  info: "info",
  tip: "lightbulb",
  warning: "warning",
  neutral: "help_outline",
};

export function InfoCard({
  title,
  children,
  variant = "neutral",
  icon,
  className = "",
}: InfoCardProps) {
  const styles = variantStyles[variant];
  const iconName = icon ?? defaultIcons[variant];

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 ${styles.bg} ${styles.border} ${className}`}
      role="region"
      aria-label={title}
    >
      <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 mb-3 ${styles.title}`}>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white/70 dark:bg-black/20 ${styles.icon} border ${styles.border}`}>
          <span className="material-icons-outlined text-lg">{iconName}</span>
        </span>
        {title}
      </h3>
      <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
