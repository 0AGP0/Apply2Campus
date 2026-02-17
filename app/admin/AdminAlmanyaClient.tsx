"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";

const CSV_HEADER = "city,criteria,program,price3Weeks,price6Weeks,price12_16Weeks,price24Weeks,price32Weeks,passRate";

export function AdminAlmanyaClient() {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null);

  async function handleImport() {
    const text = csv.trim();
    if (!text) {
      setResult({ error: "CSV yapıştırın veya yükleyin." });
      return;
    }
    setResult(null);
    setLoading(true);
    const res = await fetch("/api/admin/germany-offers/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) setResult({ count: data.count });
    else setResult({ error: data.error ?? "İçe aktarılamadı." });
  }

  return (
    <div className="panel-page max-w-4xl">
      <PageHeader
        title="Almanya teklif kataloğu"
        subtitle="Sheets'ten export ettiğiniz CSV ile kataloğu güncelleyin. Danışmanlar teklif oluştururken bu veriyi kullanır."
      />
      <div className="mt-6 space-y-4">
        <div className="panel-card p-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            CSV sütunları (İngilizce): <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{CSV_HEADER}</code>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
            Türkçe sütun adları da kabul edilir: isim, ölçütler, program adı, 3 hafta, 6 hafta, 12-16 hafta, 24 hafta, 32 hafta, pass rate. İlk satır başlık olmalı.
          </p>
          <textarea
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={`${CSV_HEADER}\nDüsseldorf,Fiyat,Yoğun Almanca 20 Ders,2100,4000,...`}
            rows={12}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm"
          />
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              onClick={handleImport}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "İçe aktarılıyor…" : "İçe aktar"}
            </button>
            {result?.count != null && <span className="text-sm text-emerald-600 dark:text-emerald-400">{result.count} satır yüklendi.</span>}
            {result?.error && <span className="text-sm text-red-600 dark:text-red-400">{result.error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
