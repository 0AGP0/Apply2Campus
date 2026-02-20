/** Teklif durumu etiketleri – tek kaynak (danışman + öğrenci listeleri ve detay). */
export const OFFER_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  SENT: "Gönderildi",
  VIEWED: "Görüntülendi",
  ACCEPTED: "Kabul edildi",
  REJECTED: "Reddedildi",
  REVISION_REQUESTED: "Revizyon istendi",
};

export function getOfferStatusLabel(status: string): string {
  return OFFER_STATUS_LABELS[status] ?? status;
}

/** Yanıt bekleyen / düzenlenebilir durumlar. */
export const ACTIVE_OFFER_STATUSES = ["DRAFT", "SENT", "VIEWED", "REVISION_REQUESTED"] as const;
