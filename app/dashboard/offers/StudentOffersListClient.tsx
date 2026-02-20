"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getOfferStatusLabel, ACTIVE_OFFER_STATUSES } from "@/lib/offer-status";

type Offer = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  itemCount: number;
  totalAmount: number;
};

function OfferCard({ o }: { o: Offer }) {
  return (
    <li className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary/30 transition-colors">
      <Link href={`/dashboard/offers/${o.id}`} className="block">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium text-slate-900 dark:text-slate-100">{o.title}</p>
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            {getOfferStatusLabel(o.status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
          {o.sentAt && <span>Gönderilme: {new Date(o.sentAt).toLocaleDateString("tr-TR")}</span>}
          {o.respondedAt && <span>Yanıt: {new Date(o.respondedAt).toLocaleDateString("tr-TR")}</span>}
        </div>
        {o.itemCount > 0 && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{o.itemCount} kalem · Toplam {o.totalAmount.toFixed(0)} €</p>}
      </Link>
    </li>
  );
}

export function StudentOffersListClient() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me/offers")
      .then((r) => r.json())
      .then((d) => setOffers(Array.isArray(d.offers) ? d.offers : []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, []);

  const activeOffers = offers.filter((o) => (ACTIVE_OFFER_STATUSES as readonly string[]).includes(o.status));
  const pastOffers = offers.filter((o) => !(ACTIVE_OFFER_STATUSES as readonly string[]).includes(o.status));

  if (loading) return <p className="text-slate-500 text-sm">Yükleniyor…</p>;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span className="material-icons-outlined text-primary text-xl">pending_actions</span>
          Aktif teklif{activeOffers.length !== 1 ? "ler" : ""}
        </h2>
        {activeOffers.length === 0 ? (
          <p className="text-slate-500 text-sm py-2">Şu an yanıt bekleyen teklif yok.</p>
        ) : (
          <ul className="space-y-3">
            {activeOffers.map((o) => (
              <OfferCard key={o.id} o={o} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <span className="material-icons-outlined text-slate-500 text-xl">history</span>
          Geçmiş teklifler
        </h2>
        {pastOffers.length === 0 ? (
          <p className="text-slate-500 text-sm py-2">Henüz sonuçlanmış teklif yok.</p>
        ) : (
          <ul className="space-y-3">
            {pastOffers.map((o) => (
              <OfferCard key={o.id} o={o} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
