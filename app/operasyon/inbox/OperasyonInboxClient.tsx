"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type BadgeItem = { id: string; name: string; color: string | null };
type Message = {
  id: string;
  studentId: string;
  gmailMessageId: string;
  studentName: string;
  from: string | null;
  to: string | null;
  subject: string | null;
  snippet: string | null;
  internalDate: string | null;
  badges?: BadgeItem[];
};
type StudentOption = { id: string; name: string };

export function OperasyonInboxClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [search, setSearch] = useState("");

  const loadStudents = useCallback(() => {
    fetch("/api/students?pageSize=500")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []));
  }, []);

  const loadInbox = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (studentId) params.set("studentId", studentId);
    if (search.trim()) params.set("search", search.trim());
    fetch(`/api/operasyon/inbox?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page, pageSize, studentId, search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  function formatDate(s: string | null) {
    if (!s) return "";
    const d = new Date(s);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("tr-TR");
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <select
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm py-2 pl-3 pr-8 min-w-[180px]"
        >
          <option value="">Tüm mailler</option>
          <option value="__unlinked__">Bağlanmamış</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Konu veya içerik ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => e.key === "Enter" && loadInbox()}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm py-2 px-3 flex-1 min-w-[200px]"
        />
        <button
          type="button"
          onClick={() => loadInbox()}
          className="rounded-xl bg-primary text-white text-sm font-medium py-2 px-4 hover:bg-primary-dark transition-colors"
        >
          Ara
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Yükleniyor…
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            E-posta bulunamadı.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((m) => (
              <li key={m.id}>
                <Link
                  href={m.studentId ? `/students/${m.studentId}/inbox/${m.gmailMessageId}` : `/operasyon/inbox/message/${m.id}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium shrink-0 ${m.studentId ? "text-primary dark:text-primary-light" : "text-amber-600 dark:text-amber-400"}`}>
                        {m.studentName || "Bağlanmamış"}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {m.from ?? "—"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {m.subject || "(Konu yok)"}
                    </p>
                    {m.snippet && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {m.snippet}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.badges?.length ? (
                      <span className="flex gap-1">
                        {m.badges.map((b) => (
                          <span
                            key={b.id}
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{ backgroundColor: `${b.color ?? "#137fec"}20`, color: b.color ?? "#137fec" }}
                          >
                            {b.name}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-400 dark:text-slate-500 w-14 text-right">
                      {formatDate(m.internalDate)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
          <span>
            Toplam {total} e-posta · Sayfa {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Önceki
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
