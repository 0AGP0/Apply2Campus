"use client";

import { useState, useEffect, useCallback } from "react";
import { PanelLayout } from "@/components/PanelLayout";
import { DURATION_KEYS, CURRENCY_KEY, PROGRAM_GRUP_KEY } from "@/lib/catalog";

const CSV_HEADER = "Ulke\tSehir\tOkul_Adi\tProgram\tProgram_Grup\tProgram_Adi\t2_Hafta\t8_Hafta\t12_Hafta\t16_Hafta\t24_Hafta\t32_Hafta\tPara_Birimi";

type CatalogRow = {
  id: string;
  country: string;
  city: string;
  schoolName: string;
  program: string;
  attributes: Record<string, string | number | null>;
  sortOrder: number;
};

const NEW_ROW_ID = "__new__";

function attrNum(attributes: Record<string, string | number | null>, key: string): string {
  const v = attributes[key];
  if (v === undefined || v === null) return "";
  return String(v);
}

function parseNum(s: string): number | null {
  const n = Number(s);
  return s !== "" && !Number.isNaN(n) ? n : null;
}

export function AdminCatalogClient() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [programGrups, setProgramGrups] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedProgramGrup, setSelectedProgramGrup] = useState<string>("");
  const [searchQ, setSearchQ] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors?: string[] } | null>(null);

  const load = useCallback(async (overrides?: { page?: number }) => {
    setLoading(true);
    setError(null);
    const p = overrides?.page ?? page;
    try {
      const params = new URLSearchParams();
      if (selectedCountry) params.set("country", selectedCountry);
      if (selectedCity) params.set("city", selectedCity);
      if (selectedProgramGrup) params.set("programGrup", selectedProgramGrup);
      if (searchQ.trim()) params.set("q", searchQ.trim());
      params.set("page", String(p));
      params.set("limit", String(limit));
      const res = await fetch(`/api/admin/germany-offers?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Yüklenemedi");
      setRows(data.rows ?? []);
      setCountries(data.countries ?? []);
      setCities(data.cities ?? []);
      setProgramGrups(data.programGrups ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 0);
      if (overrides?.page != null) setPage(overrides.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, selectedCity, selectedProgramGrup, searchQ, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleImport(customText?: string) {
    const text = (customText ?? csvText).trim();
    if (!text) {
      setError("CSV yapıştırın veya dosya seçin.");
      return;
    }
    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const url = selectedCountry
        ? `/api/admin/germany-offers/import?defaultCountry=${encodeURIComponent(selectedCountry)}`
        : "/api/admin/germany-offers/import";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
        body: text,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "İçe aktarılamadı");
      setImportResult({ created: data.created ?? 0, updated: data.updated ?? 0, errors: data.errors });
      setCsvText("");
      load({ page: 1 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "İçe aktarılamadı");
    } finally {
      setImporting(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setCsvText(text);
      if (text.trim()) handleImport(text.trim());
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  function updateRow(id: string, patch: Partial<CatalogRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  function setAttribute(rowId: string, key: string, value: string | number | null) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const next = { ...r.attributes };
        if (value === "" || value === null || value === undefined) delete next[key];
        else next[key] = value;
        return { ...r, attributes: next };
      })
    );
  }

  function buildAttributes(row: CatalogRow): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of DURATION_KEYS) {
      const v = row.attributes[key];
      if (v !== undefined && v !== null && v !== "") {
        const n = Number(v);
        if (!Number.isNaN(n)) out[key] = n;
      }
    }
    const cur = row.attributes[CURRENCY_KEY];
    if (cur !== undefined && cur !== null && String(cur).trim()) out[CURRENCY_KEY] = String(cur).trim();
    for (const [k, v] of Object.entries(row.attributes)) {
      if (DURATION_KEYS.includes(k as (typeof DURATION_KEYS)[number]) || k === CURRENCY_KEY) continue;
      if (v !== undefined && v !== null && v !== "") out[k] = typeof v === "number" ? v : String(v);
    }
    return out;
  }

  async function saveRow(row: CatalogRow) {
    const attributes = buildAttributes(row);
    const countryVal = (row.country || selectedCountry || "").trim();
    if (row.id === NEW_ROW_ID) {
      if (!countryVal || !row.city?.trim() || !row.schoolName?.trim() || !row.program?.trim()) {
        setError("Ülke, şehir, okul adı ve program zorunludur.");
        return;
      }
      setSavingId(NEW_ROW_ID);
      setError(null);
      try {
        const res = await fetch("/api/admin/germany-offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            country: countryVal,
            city: row.city.trim(),
            schoolName: row.schoolName.trim(),
            program: row.program.trim(),
            attributes,
            sortOrder: row.sortOrder ?? 0,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Eklenemedi");
        setRows((prev) => prev.map((r) => (r.id === NEW_ROW_ID ? { ...data, attributes: data.attributes ?? {} } : r)));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Eklenemedi");
      } finally {
        setSavingId(null);
      }
      return;
    }
    setSavingId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/germany-offers/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: countryVal || row.country,
          city: row.city.trim(),
          schoolName: row.schoolName.trim(),
          program: row.program.trim(),
          attributes,
          sortOrder: row.sortOrder ?? 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Kaydedilemedi");
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...data, attributes: data.attributes ?? r.attributes } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteRow(id: string) {
    if (id === NEW_ROW_ID) {
      setRows((prev) => prev.filter((r) => r.id !== NEW_ROW_ID));
      setDeleteConfirm(null);
      return;
    }
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/germany-offers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Silinemedi");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setSavingId(null);
    }
  }

  function addNewRow() {
    if (rows.some((r) => r.id === NEW_ROW_ID)) return;
    setRows((prev) => [
      ...prev,
      {
        id: NEW_ROW_ID,
        country: selectedCountry,
        city: "",
        schoolName: "",
        program: "",
        attributes: {},
        sortOrder: 0,
      },
    ]);
    setError(null);
  }

  const inputClass =
    "w-full min-w-0 px-2 py-1.5 text-sm rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none";

  return (
    <PanelLayout
      title="Teklif kataloğu"
      subtitle="Ülke seçerek katalogu filtreleyin veya CSV ile toplu içe aktarın. Sütunlar: Ulke, Sehir, Okul_Adi, Program, Program_Adi, 2_Hafta … 32_Hafta, Para_Birimi (tab veya virgül)."
      actions={
        <button
          type="button"
          onClick={addNewRow}
          disabled={rows.some((r) => r.id === NEW_ROW_ID)}
          className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          + Ürün ekle
        </button>
      }
    >
      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* CSV import */}
      <div className="mt-5 panel-card p-5 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">CSV ile içe aktar</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Başlık satırı: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{CSV_HEADER.replace(/\t/g, " | ")}</code>. Tab veya virgül. Var olan satırlar (ülke+şehir+okul+program) güncellenir, yoksa eklenir.
          </p>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <label className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
              CSV dosyası seç
              <input
                type="file"
                accept=".csv,text/csv,text/plain,application/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <span className="text-sm text-slate-500">veya aşağıya yapıştırıp İçe aktar’a basın</span>
          </div>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={CSV_HEADER + "\nAlmanya\tBerlin\t..."}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => handleImport()}
              disabled={importing || !csvText.trim()}
              className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {importing ? "İçe aktarılıyor…" : "Yapıştırdığınızı içe aktar"}
            </button>
            {importResult && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {importResult.created} eklendi, {importResult.updated} güncellendi.
                {importResult.errors?.length ? ` (${importResult.errors.length} satır atlandı)` : ""}
              </span>
            )}
          </div>
          {importResult?.errors && importResult.errors.length > 0 && (
            <ul className="mt-2 text-sm text-amber-700 dark:text-amber-400 list-disc list-inside">
              {importResult.errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {importResult.errors.length > 5 && <li>… ve {importResult.errors.length - 5} satır daha</li>}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5 panel-card overflow-hidden shadow-sm">
        {/* Filtreler – tablonun hemen üstü */}
        <div className="flex flex-wrap items-end gap-4 p-4 border-b border-slate-200 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ülke</label>
            <select
              value={selectedCountry}
              onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity(""); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 min-w-[140px] text-sm"
            >
              <option value="">Tümü</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Şehir</label>
            <select
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 min-w-[140px] text-sm"
            >
              <option value="">Tümü</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Program grubu</label>
            <select
              value={selectedProgramGrup}
              onChange={(e) => { setSelectedProgramGrup(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 min-w-[160px] text-sm"
            >
              <option value="">Tümü</option>
              {programGrups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Arama (okul / program)</label>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setPage(1)}
              placeholder="Okul veya program adı..."
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 min-w-[200px] text-sm"
            />
          </div>
          {(selectedCountry || selectedCity || selectedProgramGrup || searchQ.trim()) && (
            <button
              type="button"
              onClick={() => { setSelectedCountry(""); setSelectedCity(""); setSelectedProgramGrup(""); setSearchQ(""); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-sm hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm">Yükleniyor…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider w-24">Ülke</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider w-28">Şehir</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider min-w-[110px]">Okul Adı</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider w-28">Program Grubu</th>
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider min-w-[110px]">Program</th>
                  {DURATION_KEYS.map((d) => (
                    <th key={d} className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider w-20 min-w-[4rem]">{d} h</th>
                  ))}
                  <th className="text-left py-3 px-3 font-semibold text-xs uppercase tracking-wider w-24">Para Birimi</th>
                  <th className="text-right py-3 px-3 font-semibold text-xs uppercase tracking-wider w-28">İşlem</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
                {rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                      row.id === NEW_ROW_ID
                        ? "bg-amber-50/70 dark:bg-amber-900/20"
                        : idx % 2 === 0
                          ? "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          : "bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="py-2 px-3">
                      <input type="text" value={row.country} onChange={(e) => updateRow(row.id, { country: e.target.value })} placeholder="Ülke" className={inputClass} />
                    </td>
                    <td className="py-2 px-3">
                      <input type="text" value={row.city} onChange={(e) => updateRow(row.id, { city: e.target.value })} placeholder="Şehir" className={inputClass} />
                    </td>
                    <td className="py-2 px-3">
                      <input type="text" value={row.schoolName} onChange={(e) => updateRow(row.id, { schoolName: e.target.value })} placeholder="Okul Adı" className={inputClass} />
                    </td>
                    <td className="py-2 px-3">
                      <input type="text" value={attrNum(row.attributes, PROGRAM_GRUP_KEY)} onChange={(e) => setAttribute(row.id, PROGRAM_GRUP_KEY, e.target.value || null)} placeholder="Eğitim…" className={inputClass} />
                    </td>
                    <td className="py-2 px-3">
                      <input type="text" value={row.program} onChange={(e) => updateRow(row.id, { program: e.target.value })} placeholder="Program" className={inputClass} />
                    </td>
                    {DURATION_KEYS.map((d) => (
                      <td key={d} className="py-2 px-2">
                        <input type="number" step="0.01" value={attrNum(row.attributes, d)} onChange={(e) => setAttribute(row.id, d, e.target.value === "" ? null : Number(e.target.value))} placeholder="–" className={`${inputClass} text-right tabular-nums max-w-[5rem]`} />
                      </td>
                    ))}
                    <td className="py-2 px-3">
                      <input type="text" value={attrNum(row.attributes, CURRENCY_KEY)} onChange={(e) => setAttribute(row.id, CURRENCY_KEY, e.target.value || null)} placeholder="EUR" className={`${inputClass} max-w-[4rem]`} />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        {row.id === NEW_ROW_ID ? (
                          <>
                            <button type="button" onClick={() => saveRow(row)} disabled={savingId === NEW_ROW_ID} className="px-2.5 py-1 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
                              {savingId === NEW_ROW_ID ? "…" : "Ekle"}
                            </button>
                            <button type="button" onClick={() => { setRows((p) => p.filter((r) => r.id !== NEW_ROW_ID)); setDeleteConfirm(null); }} className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">
                              İptal
                            </button>
                          </>
                        ) : deleteConfirm === row.id ? (
                          <>
                            <span className="text-xs text-slate-500 mr-1">Sil?</span>
                            <button type="button" onClick={() => deleteRow(row.id)} className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">Evet</button>
                            <button type="button" onClick={() => setDeleteConfirm(null)} className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 text-xs">Hayır</button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => saveRow(row)} disabled={savingId === row.id} className="px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 disabled:opacity-50">
                              {savingId === row.id ? "…" : "Kaydet"}
                            </button>
                            <button type="button" onClick={() => setDeleteConfirm(row.id)} className="px-2 py-1 rounded-md text-red-600 dark:text-red-400 text-xs hover:bg-red-50 dark:hover:bg-red-900/20">
                              Sil
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length === 0 && total === 0 && (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400">
            Henüz ürün yok. CSV ile içe aktarın veya «+ Ürün ekle» ile ekleyin.
          </div>
        )}
        {!loading && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-600 bg-slate-100/80 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total} satır
              </span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Önceki
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Sayfa {page} / {totalPages || 1}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>
    </PanelLayout>
  );
}
