/** Belge durumu etiketleri – tek kaynak (danışman + öğrenci paneli). */
export type DocumentStatusValue = "UPLOADED" | "APPROVED" | "REVISION_REQUESTED";

export function getDocumentStatusLabel(status: string | undefined): string {
  if (!status) return "—";
  if (status === "APPROVED") return "Onaylandı";
  if (status === "REVISION_REQUESTED") return "Revize istendi";
  return "Yüklendi";
}

export function getDocumentStatusBadgeClass(status: string | undefined): string {
  if (status === "APPROVED") return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
  if (status === "REVISION_REQUESTED") return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
  return "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400";
}
