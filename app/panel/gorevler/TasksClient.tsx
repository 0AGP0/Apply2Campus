"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type TaskUser = { id: string; name: string };
type TaskStudent = { id: string; name: string } | null;
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  assignedBy: TaskUser | null;
  assignedTo: TaskUser | null;
  student: TaskStudent;
};
type Assignee = { id: string; name: string; email: string; role: string; roleLabel: string };
type StudentOption = { id: string; name: string };

export function TasksClient() {
  const [assignedToMe, setAssignedToMe] = useState<Task[]>([]);
  const [assignedByMe, setAssignedByMe] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAssignedToId, setFormAssignedToId] = useState("");
  const [formStudentId, setFormStudentId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, assigneesRes, studentsRes] = await Promise.all([
        fetch("/api/me/tasks"),
        fetch("/api/users/task-assignees"),
        fetch("/api/students?pageSize=500"),
      ]);
      const tasksData = await tasksRes.json();
      const assigneesData = await assigneesRes.json();
      const studentsData = await studentsRes.json();

      if (!tasksRes.ok) throw new Error(tasksData.error ?? "Görevler yüklenemedi");
      if (!assigneesRes.ok) throw new Error(assigneesData.error ?? "Atanacak kişiler yüklenemedi");

      setAssignedToMe(tasksData.assignedToMe ?? []);
      setAssignedByMe(tasksData.assignedByMe ?? []);
      setAssignees(assigneesData.users ?? []);
      setStudents(studentsData.students ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
      setAssignedToMe([]);
      setAssignedByMe([]);
      setAssignees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateTask = async () => {
    if (!formTitle.trim()) {
      setError("Başlık girin");
      return;
    }
    if (!formAssignedToId) {
      setError("Atanacak kişi seçin");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          assignedToId: formAssignedToId,
          studentId: formStudentId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Görev oluşturulamadı");
      setShowForm(false);
      setFormTitle("");
      setFormDescription("");
      setFormAssignedToId("");
      setFormStudentId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Görev oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Güncellenemedi");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Güncellenemedi");
    }
  };

  const statusLabel = (s: string) => ({ PENDING: "Bekliyor", IN_PROGRESS: "Devam ediyor", DONE: "Tamamlandı" }[s] ?? s);
  const statusBadgeClass = (s: string) => {
    if (s === "DONE") return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    if (s === "IN_PROGRESS") return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <span className="material-icons-outlined animate-spin text-3xl text-slate-400">refresh</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-2">
          <span className="material-icons-outlined text-red-600 dark:text-red-400">error</span>
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setError(null); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
        >
          <span className="material-icons-outlined text-lg">add</span>
          Görev ata
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4">Yeni görev ata</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Başlık *</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Görev başlığı"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Açıklama</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Detaylar (isteğe bağlı)"
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Atanacak kişi *</label>
              <select
                value={formAssignedToId}
                onChange={(e) => setFormAssignedToId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">Seçin</option>
                {assignees.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.roleLabel})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Öğrenci (isteğe bağlı)</label>
              <select
                value={formStudentId}
                onChange={(e) => setFormStudentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value="">Yok</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(null); }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Gönderiliyor…" : "Görev ata"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-primary">assignment</span>
            Bana atanan görevler ({assignedToMe.length})
          </h3>
          {assignedToMe.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Bana atanan görev yok.</p>
          ) : (
            <ul className="space-y-3">
              {assignedToMe.map((t) => (
                <li key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {t.assignedBy?.name ?? "—"} tarafından atandı
                        {t.student && (
                          <> · <Link href={`/students/${t.student.id}`} className="text-primary hover:underline">{t.student.name}</Link></>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(t.createdAt)}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${statusBadgeClass(t.status)}`}>{statusLabel(t.status)}</span>
                      {t.status !== "DONE" && (
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
                        >
                          <option value="PENDING">Bekliyor</option>
                          <option value="IN_PROGRESS">Devam ediyor</option>
                          <option value="DONE">Tamamlandı</option>
                        </select>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-icons-outlined text-primary">send</span>
            Benim atadığım görevler ({assignedByMe.length})
          </h3>
          {assignedByMe.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4">Henüz görev atamadınız.</p>
          ) : (
            <ul className="space-y-3">
              {assignedByMe.map((t) => (
                <li key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{t.title}</p>
                      {t.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.description}</p>}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {t.assignedTo?.name ?? "—"} atandı
                        {t.student && (
                          <> · <Link href={`/students/${t.student.id}`} className="text-primary hover:underline">{t.student.name}</Link></>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-medium ${statusBadgeClass(t.status)}`}>{statusLabel(t.status)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
