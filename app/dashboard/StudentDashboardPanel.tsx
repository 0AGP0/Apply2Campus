"use client";

import Link from "next/link";
import { useCallback } from "react";
import { StudentCrmCard } from "./StudentCrmCard";

type Stage = { slug: string; name: string; sortOrder: number };

export function StudentDashboardPanel({
  studentId,
  currentStageSlug,
  stages,
  gmailConnected,
}: {
  studentId: string;
  currentStageSlug: string;
  stages: Stage[];
  gmailConnected: boolean;
}) {
  const currentIndex = stages.findIndex((s) => s.slug === currentStageSlug);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  const scrollToCard = useCallback(() => {
    document.getElementById("kart")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const tasks = [
    {
      id: "gmail",
      label: "Gmail hesabını bağla",
      description: "Ayarlar sayfasından Gmail hesabını bağlaman gerekiyor. Danışmanın seninle ilgili süreçleri yürütebilmesi için bu adım zorunludur.",
      done: gmailConnected,
      href: "/dashboard/settings",
      cta: "Ayarlara git",
      isAnchor: false,
    },
    {
      id: "card",
      label: "Başvuru kartını doldur",
      description: "Başvuru kartındaki tüm bölümleri doldur ve belgeleri yükle. Danışmanın seni değerlendirebilmesi için kartının güncel olması önemli.",
      done: false,
      href: "#kart",
      cta: "Kartı doldur",
      isAnchor: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hoş geldin */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">
          Hoş geldin
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Aşağıdaki görevleri tamamla ve başvuru kartını güncel tut.
        </p>
      </div>

      {/* Aşama barı — Stepper (daire + bağlayıcı çizgi) */}
      {stages.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm shadow-slate-200/50 dark:shadow-slate-900/50 p-6 sm:p-8">
          <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-6">
            Başvuru aşaman
          </h2>
          <div className="relative flex items-start justify-between gap-2">
            {/* Arka plan çizgisi (tüm yol) */}
            <div
              className="absolute left-0 right-0 top-5 h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full"
              style={{ marginLeft: "1.25rem", marginRight: "1.25rem" }}
              aria-hidden
            />
            {/* İlerleme çizgisi (tamamlanan kısım) */}
            {effectiveIndex > 0 && stages.length > 1 && (
              <div
                className="absolute left-0 top-5 h-0.5 bg-primary rounded-full transition-all duration-500"
                style={{
                  marginLeft: "1.25rem",
                  width: `calc(${(effectiveIndex / (stages.length - 1)) * 100}% - 2.5rem)`,
                }}
                aria-hidden
              />
            )}
            {stages.map((stage, i) => {
              const isCompleted = i < effectiveIndex;
              const isActive = stage.slug === currentStageSlug;
              const isPending = i > effectiveIndex;
              return (
                <div
                  key={stage.slug}
                  className="relative z-10 flex flex-col items-center flex-1 min-w-0"
                >
                  {/* Daire */}
                  <div
                    className={`
                      w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                      ring-4 ring-white dark:ring-slate-900
                      transition-all duration-300
                      ${isCompleted
                        ? "bg-primary text-white"
                        : isActive
                          ? "bg-primary text-white ring-primary/20 shadow-lg shadow-primary/25"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <span className="material-icons-outlined text-lg text-white">check</span>
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  {/* Etiket */}
                  <p
                    className={`
                      mt-3 text-center text-xs font-medium max-w-[4.5rem] sm:max-w-none
                      ${isActive
                        ? "text-primary dark:text-primary"
                        : isCompleted
                          ? "text-slate-600 dark:text-slate-400"
                          : "text-slate-400 dark:text-slate-500"
                      }
                    `}
                    title={stage.name}
                  >
                    <span className="line-clamp-2 sm:line-clamp-1">{stage.name}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Yapman gerekenler / Bildirimler */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <span className="material-icons-outlined text-amber-500">notifications_active</span>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Yapman gerekenler
          </h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.map((task) => (
            <li key={task.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex gap-3 min-w-0">
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    task.done ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {task.done ? (
                    <span className="material-icons-outlined text-lg">check_circle</span>
                  ) : (
                    <span className="material-icons-outlined text-lg">info</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`font-medium text-sm ${task.done ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-800 dark:text-slate-100"}`}>
                    {task.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {task.description}
                  </p>
                </div>
              </div>
              {!task.done && (
                task.isAnchor ? (
                  <button
                    type="button"
                    onClick={scrollToCard}
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {task.cta}
                    <span className="material-icons-outlined text-lg">arrow_forward</span>
                  </button>
                ) : (
                  <Link
                    href={task.href}
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {task.cta}
                    <span className="material-icons-outlined text-lg">arrow_forward</span>
                  </Link>
                )
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Başvuru kartı */}
      <div id="kart">
        <StudentCrmCard studentId={studentId} />
      </div>
    </div>
  );
}
