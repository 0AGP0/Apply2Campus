/**
 * Tarih için "X dakika önce" formatında gösterim – tek kaynak.
 */
export function formatAgo(dateStr: string): string {
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

/**
 * İsimden baş harfler üretir (profil avatar vb.).
 */
export function initials(str: string | null | undefined): string {
  if (!str?.trim()) return "—";
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return str.slice(0, 2).toUpperCase();
}
