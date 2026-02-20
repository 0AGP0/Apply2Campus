"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PanelLayout } from "@/components/PanelLayout";

type Stats = {
  totalStudents: number;
  totalEmails: number;
  connectedGmail: number;
  expiredGmail: number;
  auditLogCount: number;
};

type Consultant = {
  id: string;
  name: string | null;
  email: string | null;
  _count?: { assignedStudents: number };
  assignedStudents?: { id: string; name: string }[];
  auditLogs?: { createdAt: string; message: string | null }[];
};

const STAT_CARDS = [
  {
    key: "totalStudents" as const,
    label: "Toplam öğrenci",
    icon: "school",
    topBar: "border-t-blue-500",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  {
    key: "totalEmails" as const,
    label: "Takip edilen mail",
    icon: "mail",
    topBar: "border-t-violet-500",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  {
    key: "connectedGmail" as const,
    label: "Gmail bağlı",
    icon: "verified_user",
    subKey: "expiredGmail" as const,
    subLabel: "süresi dolmuş",
    topBar: "border-t-emerald-500",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "auditLogCount" as const,
    label: "Denetim kayıtları",
    icon: "history",
    topBar: "border-t-slate-500",
    iconBg: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  },
];

export function AdminOverviewClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [consultants, setConsultants] = useState<Consultant[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setConsultants(data.consultants ?? []))
      .catch(() => setConsultants([]));
  }, []);

  function formatAgo(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffM = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffM / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffM < 1) return "az önce";
    if (diffM < 60) return `${diffM} dk önce`;
    if (diffH < 24) return `${diffH} sa önce`;
    if (diffD < 7) return `${diffD} gün önce`;
    return d.toLocaleDateString("tr-TR");
  }

  function initials(str: string | null | undefined): string {
    if (!str?.trim()) return "—";
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    return str.slice(0, 2).toUpperCase();
  }

  const connectedGmail = stats?.connectedGmail ?? 0;
  const expiredGmail = stats?.expiredGmail ?? 0;
  const gmailTotal = connectedGmail + expiredGmail;
  const connectivityPercent = gmailTotal > 0 ? Math.round((connectedGmail / gmailTotal) * 100) : 0;

  return (
    <PanelLayout
      title="Özet"
      subtitle="Genel istatistikler ve danışman verimliliği"
    >
      <section className="space-y-5 mt-4">
        <h2 className="panel-section-title flex items-center gap-2 pl-4 border-l-4 border-primary">
          Genel bilgiler
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CARDS.map((card) => (
            <div
              key={card.key}
              className={`panel-stat-card ${card.topBar} p-6 flex flex-col gap-4 group`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.iconBg} transition-transform group-hover:scale-105 shadow-inner`}
                >
                  <span className="material-icons-outlined text-3xl">
                    {card.icon}
                  </span>
                </div>
                {card.key === "totalStudents" && stats && stats.totalStudents > 0 && (
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    Aktif
                  </span>
                )}
                {card.key === "connectedGmail" && gmailTotal > 0 && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    {connectivityPercent}%
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {stats?.[card.key] ?? "—"}
              </p>
              {card.subKey && stats != null && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg px-2.5 py-1 w-fit">
                  {stats[card.subKey]} {card.subLabel}
                </p>
              )}
              {card.key === "totalEmails" && stats != null && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Takip edilen e-posta sayısı
                </p>
              )}
              {card.key === "auditLogCount" && stats != null && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Sistem genelinde kayıt
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          <section className="space-y-5">
            <div className="flex items-center justify-between pl-4 border-l-4 border-primary">
              <h2 className="panel-section-title">Danışman özeti</h2>
              <Link
                href="/admin/danismanlar"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Tüm danışmanlar →
              </Link>
            </div>
            <div className="panel-card">
              <table className="w-full text-left">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-th">Danışman</th>
                    <th className="table-th">Atanan öğrenci</th>
                    <th className="table-th">Son aktivite</th>
                    <th className="table-th text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/80">
                  {consultants.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="table-td text-center text-slate-500 py-12">
                        Henüz danışman yok.
                      </td>
                    </tr>
                  ) : (
                    consultants.map((c) => {
                      const count = c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0;
                      const lastLog = c.auditLogs?.[0];
                      const name = c.name ?? c.email ?? "—";
                      return (
                        <tr key={c.id} className="table-row-hover table-row-zebra">
                          <td className="table-td">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                {initials(name)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {name}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">{c.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="table-td">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {count} öğrenci
                            </span>
                          </td>
                          <td className="table-td text-slate-600 dark:text-slate-400">
                            {lastLog ? (
                              <span title={lastLog.message ?? undefined}>
                                {formatAgo(lastLog.createdAt)}
                                {lastLog.message && (
                                  <span className="block truncate max-w-[200px] text-xs text-slate-400 mt-1">
                                    {lastLog.message}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="table-td text-right">
                            <Link
                              href={`/admin/ogrenciler?consultantId=${c.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              Öğrenciler
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="panel-card p-6 sticky top-24">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-sm">insights</span>
              Sistem özeti
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Gmail bağlı</span>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {stats?.connectedGmail ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm">Süresi dolmuş</span>
                </div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  {stats?.expiredGmail ?? 0}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    Bağlantı oranı
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {gmailTotal > 0 ? `${connectivityPercent}%` : "—"}
                  </p>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${connectivityPercent}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              Özet veriler anlık istatistiklerden alınır.
            </p>
          </div>
        </aside>
      </div>
    </PanelLayout>
  );
}
