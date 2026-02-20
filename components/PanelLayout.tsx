"use client";

import Link from "next/link";

export type PanelLayoutProps = {
  /** Sayfa başlığı */
  title: React.ReactNode;
  /** Kısa açıklama (alt satır) */
  subtitle?: React.ReactNode;
  /** Sağ tarafta gösterilecek buton/menü */
  actions?: React.ReactNode;
  /** Geri linki (varsa sol tarafta ok çıkar) */
  backHref?: string;
  backLabel?: string;
  /** Sticky header */
  sticky?: boolean;
  children: React.ReactNode;
};

/**
 * Tüm panel sayfalarında ortak layout: tek tip boşluk + aynı header tasarımı.
 * /panel, /admin, /operasyon, /students listesi hepsi bu bileşeni kullanmalı.
 */
export function PanelLayout({
  title,
  subtitle,
  actions,
  backHref,
  backLabel = "Geri",
  sticky = false,
  children,
}: PanelLayoutProps) {
  return (
    <div className="panel-layout">
      <header
        className={`panel-layout__header ${sticky ? "panel-layout__header--sticky" : ""}`}
      >
        {backHref && (
          <Link
            href={backHref}
            className="panel-layout__back"
            aria-label={backLabel}
          >
            <span className="material-icons-outlined">arrow_back</span>
          </Link>
        )}
        <div className="panel-layout__header-inner">
          <h1 className="panel-layout__title">{title}</h1>
          {subtitle && <p className="panel-layout__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="panel-layout__actions">{actions}</div>}
      </header>
      <main className="panel-layout__main">{children}</main>
    </div>
  );
}
