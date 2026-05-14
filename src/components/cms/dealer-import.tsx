"use client";

import { useRef, useState } from "react";
import type { ImportRow } from "@/app/api/cms/dealers/import/route";

// Brand slug mapping (Excel "Márka" column value → slug(s))
const BRAND_SLUG_MAP: Record<string, string[]> = {
  BAIC: ["baic"],
  BYD: ["byd"],
  Chery: ["chery"],
  Dongfeng: ["dongfeng"],
  Geely: ["geely"],
  Leapmotor: ["leapmotor"],
  Maxus: ["maxus"],
  MG: ["mg"],
  NIO: ["nio"],
  "Omoda / Jaecoo": ["omoda", "jaecoo"],
  Omoda: ["omoda"],
  Jaecoo: ["jaecoo"],
  Voyah: ["voyah"],
  XPENG: ["xpeng"],
  Firefly: ["firefly"],
  firefly: ["firefly"],
};

function toStr(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = Number(val);
  return isFinite(n) && n !== 0 ? n : null;
}

function parseRows(sheetData: unknown[][]): ImportRow[] {
  // Skip header row (index 0)
  const dataRows = sheetData.slice(1);
  const result: ImportRow[] = [];

  for (const row of dataRows) {
    const cols = row as unknown[];
    const brandRaw = toStr(cols[0]);
    if (!brandRaw) continue; // skip empty rows

    const slugs = BRAND_SLUG_MAP[brandRaw];
    if (!slugs) continue; // unknown brand

    const utca = toStr(cols[4]);
    const hazszam = toStr(cols[5]);
    const street = hazszam ? `${utca} ${hazszam}`.trim() : utca;

    const rawEmails = [cols[6], cols[7], cols[8], cols[9]].map(toStr).filter(Boolean);
    const email = rawEmails[0] ?? "";
    const extra_emails = rawEmails.slice(1);

    const rawPhones = [cols[10], cols[11], cols[12], cols[13], cols[14]].map(toStr).filter(Boolean);
    const phone = rawPhones[0] ?? "";
    const extra_phones = rawPhones.slice(1);

    const lastCheckedRaw = toStr(cols[22]);
    let last_checked_at: string | null = null;
    if (lastCheckedRaw) {
      // Try to parse as date
      const d = new Date(lastCheckedRaw);
      if (!isNaN(d.getTime())) {
        last_checked_at = d.toISOString();
      } else {
        last_checked_at = lastCheckedRaw;
      }
    }

    result.push({
      brand_slugs: slugs,
      name: toStr(cols[1]),
      zip_code: toStr(cols[2]),
      city: toStr(cols[3]),
      street,
      email,
      extra_emails,
      phone,
      extra_phones,
      website: toStr(cols[15]),
      lat: toNum(cols[16]),
      lng: toNum(cols[17]),
      source_url: toStr(cols[18]),
      data_quality: toStr(cols[19]),
      data_source: toStr(cols[20]),
      notes: toStr(cols[21]),
      last_checked_at,
    });
  }

  return result;
}

type ResultState =
  | { kind: "success"; imported: number; skipped: number; errors: string[] }
  | { kind: "error"; message: string };

type BrandInfo = { id: string; name: string; slug: string };

export function DealerImport({ brands }: { brands: BrandInfo[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ImportRow[] | null>(null);
  const [clearFirst, setClearFirst] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const knownSlugs = new Set(brands.map((b) => b.slug));

  // Count total rows that will be inserted (Omoda/Jaecoo doubles)
  const totalInsertCount = parsedRows
    ? parsedRows.reduce((acc, r) => acc + r.brand_slugs.length, 0)
    : 0;
  const sourceRowCount = parsedRows?.length ?? 0;
  const doubleCount = totalInsertCount - sourceRowCount;

  async function handleFile(file: File) {
    setParseError(null);
    setParsedRows(null);
    setResult(null);

    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });

      // Try sheet "Kereskedések" first, fall back to first sheet
      const sheetName = wb.SheetNames.includes("Kereskedések")
        ? "Kereskedések"
        : wb.SheetNames[0];

      if (!sheetName) {
        setParseError("Az Excel fájl üres.");
        return;
      }

      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
      const rows = parseRows(data as unknown[][]);

      if (rows.length === 0) {
        setParseError("Nem sikerült sorokat kiolvasni. Ellenőrizd, hogy a fájl tartalmaz-e adatsorokat a fejléc után.");
        return;
      }

      setParsedRows(rows);
    } catch (e) {
      setParseError(`Elemzési hiba: ${(e as Error).message}`);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function runImport() {
    if (!parsedRows || parsedRows.length === 0) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/cms/dealers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, clear_first: clearFirst }),
      });
      const j = await res.json().catch(() => ({})) as Record<string, unknown>;
      if (!res.ok) {
        setResult({ kind: "error", message: String(j.error ?? "Ismeretlen hiba") });
      } else {
        setResult({
          kind: "success",
          imported: Number(j.imported ?? 0),
          skipped: Number(j.skipped ?? 0),
          errors: Array.isArray(j.errors) ? (j.errors as string[]) : [],
        });
      }
    } catch (e) {
      setResult({ kind: "error", message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── File picker ── */}
      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ margin: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-mute)" }}>
            1. Excel fájl kiválasztása
          </h2>
        </div>
        <div
          style={{ padding: 24 }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div
            style={{
              border: "2px dashed var(--border)",
              borderRadius: 8,
              padding: "32px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: "var(--surface)",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ color: "var(--ink-mute)", fontSize: 14 }}>
              Húzd ide az Excel fájlt, vagy kattints a kiválasztáshoz
            </div>
            <div style={{ color: "var(--ink-mute)", fontSize: 12, marginTop: 4 }}>
              Csak .xlsx formátum fogadott el
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          {parseError ? (
            <div className="err" style={{ marginTop: 12 }}>{parseError}</div>
          ) : null}
        </div>
      </div>

      {/* ── Preview ── */}
      {parsedRows && parsedRows.length > 0 ? (
        <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 14, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-mute)" }}>
              2. Előnézet
            </h2>
            <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>
              {sourceRowCount} kereskedő sor → {totalInsertCount} DB sor
              {doubleCount > 0 ? ` (${sourceRowCount} + ${doubleCount} Omoda/Jaecoo dupla)` : ""}
            </span>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 480, overflowY: "auto" }}>
            <table className="cms-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Márka</th>
                  <th>Kereskedés neve</th>
                  <th>Város</th>
                  <th>Ir.sz.</th>
                  <th>Email(ek)</th>
                  <th>Telefon(ok)</th>
                  <th>GPS</th>
                  <th>Minőség</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => {
                  const isWarning = row.data_quality === "warning";
                  const isDouble = row.brand_slugs.length > 1;
                  const unknownSlugs = row.brand_slugs.filter((s) => !knownSlugs.has(s));
                  return (
                    <tr
                      key={i}
                      style={isWarning ? { background: "rgba(234,179,8,0.08)" } : undefined}
                    >
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                          {row.brand_slugs.map((s) => (
                            <span
                              key={s}
                              className="pill"
                              style={{
                                background: unknownSlugs.includes(s) ? "#7f1d1d" : "var(--surface-2)",
                                color: unknownSlugs.includes(s) ? "#fca5a5" : "var(--ink)",
                                fontSize: 11,
                              }}
                            >
                              {s}
                            </span>
                          ))}
                          {isDouble ? (
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              background: "#7c2d12",
                              color: "#fed7aa",
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}>
                              ×2
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{row.name}</td>
                      <td>{row.city}</td>
                      <td style={{ color: "var(--ink-mute)", fontSize: 12 }}>{row.zip_code}</td>
                      <td style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                        {[row.email, ...row.extra_emails].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                        {[row.phone, ...row.extra_phones].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                        {row.lat && row.lng ? `${row.lat}, ${row.lng}` : "—"}
                      </td>
                      <td>
                        {row.data_quality === "warning" ? (
                          <span className="pill" style={{ background: "#713f12", color: "#fef08a", fontSize: 11 }}>warning</span>
                        ) : row.data_quality === "ok" ? (
                          <span className="pill ok" style={{ fontSize: 11 }}>ok</span>
                        ) : (
                          <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── Options ── */}
      {parsedRows && parsedRows.length > 0 ? (
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 14, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--ink-mute)" }}>
            3. Beállítások
          </h2>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={clearFirst}
              onChange={(e) => setClearFirst(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              <strong>Meglévők törlése importálás előtt</strong>
              <span style={{ color: "var(--ink-mute)", fontSize: 13 }}> — csak a dealereket törli</span>
              {clearFirst ? (
                <div style={{
                  marginTop: 6,
                  padding: "6px 10px",
                  background: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(220,38,38,0.3)",
                  borderRadius: 6,
                  color: "#fca5a5",
                  fontSize: 12,
                  fontWeight: 500,
                }}>
                  Figyelem: ez töröl minden meglévő kereskedőt az adatbázisból az importálás előtt!
                </div>
              ) : null}
            </span>
          </label>
        </div>
      ) : null}

      {/* ── Import button ── */}
      {parsedRows && parsedRows.length > 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            className="cms-btn primary"
            onClick={runImport}
            disabled={busy}
            style={{ minWidth: 180 }}
          >
            {busy
              ? "Importálás folyamatban…"
              : `Importálás (${totalInsertCount} sor)`}
          </button>
          <span style={{ color: "var(--ink-mute)", fontSize: 13 }}>
            {clearFirst ? "Törlés + importálás" : "Hozzáfűzés a meglévőkhöz"}
          </span>
        </div>
      ) : null}

      {/* ── Result ── */}
      {result ? (
        <div className="cms-card" style={{ padding: "16px 20px" }}>
          {result.kind === "success" ? (
            <div>
              <div className="ok" style={{ marginBottom: result.errors.length > 0 ? 12 : 0 }}>
                Sikeres importálás: {result.imported} sor beírva
                {result.skipped > 0 ? `, ${result.skipped} kihagyva` : ""}.
              </div>
              {result.errors.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6, color: "#fbbf24" }}>Figyelmeztetések:</div>
                  <ul style={{ margin: 0, paddingLeft: 20, color: "#fbbf24", fontSize: 13 }}>
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="err">{result.message}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
