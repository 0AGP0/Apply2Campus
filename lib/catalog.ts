/**
 * Katalog attribute yapısı: süre (hafta) = fiyat, currency + serbest alanlar.
 * attributes örn: { "2": 1500, "8": 4000, "currency": "EUR", "notes": "..." }
 */

/** Fiyat tanımlı süreler (hafta). Yeni süre eklemek için bu listeye ekle. */
export const DURATION_KEYS = ["2", "8", "12", "16", "24", "32"] as const;

/** UI için süre seçenekleri (teklif formu vb.) – tek kaynak. */
export const DURATION_OPTIONS = [
  { value: 2, label: "2 Hafta" },
  { value: 8, label: "8 Hafta" },
  { value: 12, label: "12 Hafta" },
  { value: 16, label: "16 Hafta" },
  { value: 24, label: "24 Hafta" },
  { value: 32, label: "32 Hafta" },
] as const;

export const CURRENCY_KEY = "currency";

/** Program grubu (kategori): Eğitim, Konaklama, Diğer vb. */
export const PROGRAM_GRUP_KEY = "programGrup";

export type CatalogAttributes = Record<string, string | number | null>;

/** attributes objesinden süre (hafta) fiyatını al. */
export function getPriceForDuration(
  attributes: CatalogAttributes | null | undefined,
  durationWeeks: number
): number | null {
  if (!attributes || typeof attributes !== "object") return null;
  const key = String(durationWeeks);
  const v = attributes[key];
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** attributes objesinden para birimini al. */
export function getCurrency(attributes: CatalogAttributes | null | undefined): string | null {
  if (!attributes || typeof attributes !== "object") return null;
  const v = attributes[CURRENCY_KEY];
  return typeof v === "string" ? v : null;
}

/** attributes objesinden program grubunu al (Eğitim, Konaklama, Diğer vb.). */
export function getProgramGrup(attributes: CatalogAttributes | null | undefined): string | null {
  if (!attributes || typeof attributes !== "object") return null;
  const v = attributes[PROGRAM_GRUP_KEY];
  return typeof v === "string" ? v : null;
}

/** Fiyat sütunları dışında kalan attribute anahtarları (currency dahil, süre sayıları hariç). */
export function getExtraAttributeKeys(attributes: CatalogAttributes | null | undefined): string[] {
  if (!attributes || typeof attributes !== "object") return [];
  const durationSet = new Set<string>(DURATION_KEYS);
  return Object.keys(attributes).filter((k) => !durationSet.has(k));
}
