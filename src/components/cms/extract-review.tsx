"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Extraction = {
  id: string;
  status: "pending" | "approved" | "rejected" | "failed";
  source_kind: "pdf" | "url";
  source_url: string | null;
  source_filename: string | null;
  storage_path: string | null;
  llm_provider: string;
  llm_model: string | null;
  raw_text: string | null;
  parsed_json: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  decided_at: string | null;
  applied_at: string | null;
  model: Record<string, unknown> & { name: string; brand: { name: string } | null };
};

const FIELDS: { key: string; label: string; unit?: string; numeric?: boolean }[] = [
  { key: "price_min_m_ft", label: "Alapár (M Ft)", numeric: true },
  { key: "price_max_m_ft", label: "Csúcsár (M Ft)", numeric: true },
  { key: "length_mm", label: "Hossz", unit: "mm", numeric: true },
  { key: "width_mm", label: "Szélesség", unit: "mm", numeric: true },
  { key: "height_mm", label: "Magasság", unit: "mm", numeric: true },
  { key: "wheelbase_mm", label: "Tengelytáv", unit: "mm", numeric: true },
  { key: "trunk_l", label: "Csomagtartó", unit: "l", numeric: true },
  { key: "seats", label: "Ülőhelyek", numeric: true },
  { key: "power_hp", label: "Teljesítmény", unit: "LE", numeric: true },
  { key: "battery_kwh", label: "Akku", unit: "kWh", numeric: true },
  { key: "range_km", label: "Hatótáv", unit: "km", numeric: true },
  { key: "consumption_text", label: "Fogyasztás" },
  { key: "acceleration_s", label: "Gyorsulás 0–100", unit: "s", numeric: true },
  { key: "charging_ac_kw", label: "AC töltés", unit: "kW", numeric: true },
  { key: "charging_dc_kw", label: "DC töltés", unit: "kW", numeric: true },
  { key: "charging_text", label: "Töltési szöveg" },
  { key: "warranty_years", label: "Garancia (év)", numeric: true },
  { key: "warranty_km", label: "Garancia (km)", numeric: true },
  { key: "battery_warranty_years", label: "Akku-garancia (év)", numeric: true },
  { key: "battery_warranty_km", label: "Akku-garancia (km)", numeric: true },
];

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString("hu-HU");
  return String(v);
}

export function ExtractReview({ extraction }: { extraction: Extraction }) {
  const router = useRouter();
  const [parsed, setParsed] = useState<Record<string, unknown>>(
    extraction.parsed_json ?? {},
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  // Map M Ft fields if LLM only returned HUF.
  const huf = (k: "price_min_m_ft" | "price_max_m_ft", srcKey: "price_min_huf" | "price_max_huf") => {
    if (parsed[k] == null && parsed[srcKey] != null) {
      const n = Number(parsed[srcKey]);
      if (Number.isFinite(n)) return Math.round((n / 1_000_000) * 100) / 100;
    }
    return parsed[k];
  };
  const display: Record<string, unknown> = {
    ...parsed,
    price_min_m_ft: huf("price_min_m_ft", "price_min_huf"),
    price_max_m_ft: huf("price_max_m_ft", "price_max_huf"),
  };

  function setField(key: string, raw: string, numeric: boolean | undefined) {
    setParsed((p) => {
      const next = { ...p };
      if (raw === "") next[key] = null;
      else if (numeric) {
        const n = Number(raw.replace(",", "."));
        next[key] = Number.isFinite(n) ? n : null;
      } else next[key] = raw;
      return next;
    });
  }

  async function call(action: "approve" | "reject" | "edit") {
    setBusy(true); setErr(null);
    const res = await fetch(`/api/cms/extract/${extraction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, parsed_json: parsed }),
    });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(j.error || "Művelet sikertelen");
    if (action === "approve") {
      router.push(`/c4m5s6/modellek/${extraction.model && (extraction.model as { id?: string }).id}`);
    } else {
      router.refresh();
    }
  }

  const isPending = extraction.status === "pending";
  const isFailed = extraction.status === "failed";

  return (
    <>
      <p className="lede">
        Modell: <b>{extraction.model.brand?.name ?? ""} {extraction.model.name}</b>
        {" · "}LLM: {extraction.llm_provider}{extraction.llm_model ? ` (${extraction.llm_model})` : ""}
        {" · "}Státusz: {extraction.status}
      </p>

      {err ? <div className="err">{err}</div> : null}
      {isFailed ? (
        <div className="cms-card">
          <h2 style={{ margin: "0 0 6px" }}>Hiba</h2>
          <div style={{ color: "#fca5a5", fontSize: 13 }}>{extraction.error_message}</div>
        </div>
      ) : null}

      <h2>Javasolt értékek vs. jelenlegi modell</h2>
      <div className="cms-card">
        <div className="cms-diff" style={{ marginBottom: 8 }}>
          <div className="label">Mező</div>
          <div className="label">Jelenlegi (modell)</div>
          <div className="label">Javasolt (LLM) — szerkeszthető</div>
        </div>
        {FIELDS.map((f) => {
          const cur = (extraction.model as Record<string, unknown>)[f.key];
          const sug = (display as Record<string, unknown>)[f.key];
          const changed =
            sug != null && sug !== "" && (cur ?? null) !== (sug ?? null);
          return (
            <div className={`cms-diff ${changed ? "" : ""}`} key={f.key}>
              <div className="label">{f.label}{f.unit ? ` (${f.unit})` : ""}</div>
              <div>{fmt(cur)}</div>
              <div className={changed ? "changed" : ""}>
                <input
                  style={{
                    background: "#0f172a", color: "#e2e8f0",
                    border: "1px solid #334155", borderRadius: 4,
                    padding: "4px 6px", width: "100%", fontSize: 13,
                  }}
                  value={
                    sug == null || sug === ""
                      ? ""
                      : typeof sug === "number"
                        ? String(sug)
                        : String(sug)
                  }
                  onChange={(e) => setField(f.key, e.target.value, f.numeric)}
                  disabled={!isPending}
                />
              </div>
            </div>
          );
        })}
        <div className="cms-diff" style={{ marginTop: 6 }}>
          <div className="label">Megjegyzés</div>
          <div>—</div>
          <div>{fmt(parsed.notes)}</div>
        </div>
      </div>

      {isPending ? (
        <div className="cms-actions">
          <button className="cms-btn primary" disabled={busy} onClick={() => call("approve")}>
            {busy ? "…" : "Jóváhagyás és modellbe írás"}
          </button>
          <button className="cms-btn ghost" disabled={busy} onClick={() => call("edit")}>
            Mentés vázlatként
          </button>
          <button className="cms-btn danger" disabled={busy} onClick={() => call("reject")}>
            Elutasítás
          </button>
        </div>
      ) : null}

      <h2>Forrás</h2>
      <div className="cms-card">
        <div style={{ marginBottom: 8, fontSize: 13, color: "#94a3b8" }}>
          {extraction.source_kind === "pdf" ? (
            <>PDF: <code>{extraction.source_filename}</code></>
          ) : (
            <>URL: <a href={extraction.source_url ?? "#"} target="_blank" rel="noreferrer" style={{ color: "#93c5fd" }}>{extraction.source_url}</a></>
          )}
        </div>
        <button className="cms-btn ghost" onClick={() => setShowRaw((s) => !s)}>
          {showRaw ? "Nyers szöveg elrejtése" : "Nyers szöveg megjelenítése"}
        </button>
        {showRaw ? (
          <pre style={{
            marginTop: 12, padding: 12, background: "#0f172a",
            border: "1px solid #1f2937", borderRadius: 6,
            fontSize: 12, lineHeight: 1.45, maxHeight: 480, overflow: "auto",
            whiteSpace: "pre-wrap", color: "#cbd5e1",
          }}>{extraction.raw_text ?? ""}</pre>
        ) : null}
      </div>
    </>
  );
}
