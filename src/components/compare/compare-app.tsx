"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { ModelRow } from "@/lib/types";
import { fmtPrice, parseCompareTokens } from "@/lib/format";
import { photoUrl } from "@/lib/media-urls";
import "./compare.css";

// Variant-specific fields — when a variant is selected, these come from the
// engine_options row; otherwise they fall back to the model-level value.
const VARIANT_FIELDS = new Set([
  "range_km", "power_hp", "battery_kwh", "trunk_l", "seats",
  "consumption_text", "charging_ac_kw", "charging_dc_kw", "charging_text", "acceleration_s",
]);

type Col = {
  brand: string;
  model: string;
  /** UUID of the selected engine_options row, or null when the model has no variants */
  variantId: string | null;
};

type Row =
  | { section: string; id?: never }
  | {
      section?: never;
      id: string;
      label: string;
      best?: "min" | "max";
      fmt?: (v: unknown, c: Col, m: ModelRow | null) => React.ReactNode;
    };

const ROWS: Row[] = [
  { section: "Alapadatok" },
  { id: "brand_name", label: "Márka" },
  { id: "name", label: "Modell" },
  { id: "trim", label: "Változat" },
  { id: "category", label: "Kategória" },
  { id: "drive", label: "Hajtás" },
  { section: "Árak" },
  {
    id: "price_min_m_ft",
    label: "Alapár",
    best: "min",
    fmt: (v) => fmtPrice(v as number | null),
  },
  {
    id: "price_max_m_ft",
    label: "Csúcsfelszereltség",
    fmt: (v) => fmtPrice(v as number | null),
  },
  {
    id: "is_deal",
    label: "Akciós",
    fmt: (v) => (v ? "Igen" : "—"),
  },
  { section: "Méretek" },
  {
    id: "length_mm",
    label: "Hossz",
    best: "max",
    fmt: (v) => (v == null ? "—" : `${v} mm`),
  },
  { id: "width_mm", label: "Szélesség", fmt: (v) => (v == null ? "—" : `${v} mm`) },
  { id: "height_mm", label: "Magasság", fmt: (v) => (v == null ? "—" : `${v} mm`) },
  {
    id: "wheelbase_mm",
    label: "Tengelytáv",
    fmt: (v) => (v == null ? "—" : `${v} mm`),
  },
  {
    id: "trunk_l",
    label: "Csomagtartó",
    best: "max",
    fmt: (v) => (v == null ? "—" : `${v} l`),
  },
  {
    id: "seats",
    label: "Ülőhelyek",
    fmt: (v) => (v == null ? "—" : String(v)),
  },
  { section: "Hajtáslánc" },
  {
    id: "power_hp",
    label: "Teljesítmény",
    best: "max",
    fmt: (v) => (v == null ? "—" : `${v} LE`),
  },
  {
    id: "battery_kwh",
    label: "Akku kapacitás",
    best: "max",
    fmt: (v) =>
      v == null ? "—" : `${(v as number).toString().replace(".", ",")} kWh`,
  },
  {
    id: "range_km",
    label: "Hatótáv",
    best: "max",
    fmt: (v) => (v == null ? "—" : `${v} km`),
  },
  {
    id: "consumption_text",
    label: "Fogyasztás",
    fmt: (v) => (v ? String(v) : "—"),
  },
  {
    id: "charging_text",
    label: "Töltési adatok",
    fmt: (v) => (v ? String(v) : "—"),
  },
  {
    id: "valuePerKm",
    label: "Ft / km (alapár / hatótáv)",
    best: "min",
    fmt: (v) =>
      v == null
        ? "—"
        : `${Math.round(v as number).toLocaleString("hu-HU")} Ft`,
  },
  { section: "Egyéb" },
  {
    id: "warranty_years",
    label: "Garancia",
    fmt: (v, _c, m) =>
      v == null
        ? "—"
        : `${v} év${m?.warranty_km ? ` / ${m.warranty_km.toLocaleString("hu-HU")} km` : ""}`,
  },
  { id: "updated", label: "Utolsó frissítés", fmt: (_v, _c, m) => m?.data_updated_at?.replace(/-/g, ".") ?? "—" },
];

export function CompareApp({ models }: { models: ModelRow[] }) {
  const sp = useSearchParams();
  const [cols, setCols] = useState<Col[]>(() => {
    const tokens = parseCompareTokens(sp.get("models"));
    const initial = tokens.map((t) => {
      // Auto-select the first engine variant if the model has any
      const found = models.find(
        (m) => m.brand_name === t.brand && m.name === t.name,
      );
      return {
        brand: t.brand,
        model: t.name,
        variantId: found?.engine_options?.[0]?.id ?? null,
      };
    });
    while (initial.length < 4)
      initial.push({ brand: "", model: "", variantId: null });
    return initial.slice(0, 4);
  });

  const allBrands = useMemo(
    () => Array.from(new Set(models.map((m) => m.brand_name))).sort(),
    [models],
  );

  function getModel(c: Col): ModelRow | null {
    if (!c.brand || !c.model) return null;
    return (
      models.find((m) => m.brand_name === c.brand && m.name === c.model) ?? null
    );
  }

  function getVariant(c: Col, m: ModelRow) {
    if (!c.variantId) return null;
    return m.engine_options?.find((o) => o.id === c.variantId) ?? null;
  }

  function value(rowId: string, c: Col): unknown {
    // "trim" row: show selected variant name or "Alap" if no variants
    if (rowId === "trim") {
      const m = getModel(c);
      if (!m) return null;
      const opts = m.engine_options ?? [];
      if (opts.length === 0) return "Alap";
      const v = getVariant(c, m);
      return v?.name ?? null;
    }
    const m = getModel(c);
    if (!m) return null;

    // For variant-specific fields, prefer the selected variant's value
    if (VARIANT_FIELDS.has(rowId) && c.variantId) {
      const v = getVariant(c, m);
      if (v) {
        const varVal = (v as unknown as Record<string, unknown>)[rowId];
        if (varVal != null) return varVal;
      }
    }

    if (rowId === "valuePerKm") {
      // Use effective range (variant-specific if selected, else model-level)
      const effectiveRange = (() => {
        if (c.variantId) {
          const v = getVariant(c, m);
          if (v?.range_km != null) return v.range_km;
        }
        return m.range_km;
      })();
      if (m.price_min_m_ft && effectiveRange)
        return (m.price_min_m_ft * 1_000_000) / effectiveRange;
      return null;
    }

    return (m as unknown as Record<string, unknown>)[rowId] ?? null;
  }

  function findBestIdx(rowId: string, kind: "min" | "max"): number {
    const vals = cols.map((c) => value(rowId, c));
    const numeric = vals.map((v) => (typeof v === "number" ? v : null));
    const filtered = numeric.filter((v): v is number => v != null);
    if (filtered.length < 2) return -1;
    const target = kind === "min" ? Math.min(...filtered) : Math.max(...filtered);
    return numeric.findIndex((v) => v === target);
  }

  function setCol(idx: number, patch: Partial<Col>) {
    setCols((prev) =>
      prev.map((c, i) => {
        if (i !== idx) return c;
        // Brand changed → reset model + variant
        if (patch.brand !== undefined && patch.brand !== c.brand)
          return { brand: patch.brand, model: "", variantId: null };
        const next = { ...c, ...patch };
        // Model changed → auto-select first available variant (or null)
        if (patch.model !== undefined && patch.model !== c.model) {
          const found = models.find(
            (m) => m.brand_name === next.brand && m.name === next.model,
          );
          next.variantId = found?.engine_options?.[0]?.id ?? null;
        }
        return next;
      }),
    );
  }

  return (
    <div className="container">
      <div className="cmp-toolbar">
        <div className="info">
          Aktív oszlopok:{" "}
          <b>{cols.filter((c) => c.brand && c.model).length}</b> / 4
        </div>
        <div className="actions">
          <button
            type="button"
            className="cmp-btn"
            onClick={() =>
              setCols(cols.map(() => ({ brand: "", model: "", variantId: null })))
            }
          >
            <X size={14} /> Üres oszlopok
          </button>
        </div>
      </div>

      <div className="cmp-wrap">
        <div className="cmp-table" style={{ ["--cols" as string]: cols.length }}>
          {/* Header row with selectors */}
          <div className="row">
            <div className="cell">Választó</div>
            {cols.map((c, idx) => {
              const m = getModel(c);
              const photo = photoUrl(m?.primary_photo_path);
              const modelsForBrand = c.brand
                ? models.filter((mm) => mm.brand_name === c.brand)
                : [];
              return (
                <div className="head-cell" key={idx}>
                  <button
                    type="button"
                    className="close"
                    title="Oszlop ürítése"
                    onClick={() =>
                      setCol(idx, { brand: "", model: "", variantId: null })
                    }
                  >
                    <X size={14} />
                  </button>
                  <div className="photo-slot">
                    {photo ? (
                      <img src={photo} alt={`${c.brand} ${c.model}`} />
                    ) : (
                      <span className="ph">
                        {m ? `${c.brand} ${c.model}` : "Nincs kiválasztva"}
                      </span>
                    )}
                  </div>
                  <div className="selector">
                    <label>Márka</label>
                    <select
                      value={c.brand}
                      onChange={(e) => setCol(idx, { brand: e.target.value })}
                    >
                      <option value="">— válassz —</option>
                      {allBrands.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="selector">
                    <label>Modell</label>
                    <select
                      value={c.model}
                      disabled={!c.brand}
                      onChange={(e) => setCol(idx, { model: e.target.value })}
                    >
                      <option value="">
                        {c.brand ? "— válassz —" : "előbb márka"}
                      </option>
                      {modelsForBrand.map((mm) => (
                        <option key={mm.id} value={mm.name}>
                          {mm.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="selector">
                    <label>Változat</label>
                    {(() => {
                      const opts = m?.engine_options ?? [];
                      if (!m || !c.model) {
                        return (
                          <select disabled>
                            <option>előbb modell</option>
                          </select>
                        );
                      }
                      if (opts.length === 0) {
                        return (
                          <select disabled>
                            <option>Nincs modellváltozat</option>
                          </select>
                        );
                      }
                      return (
                        <select
                          value={c.variantId ?? ""}
                          onChange={(e) =>
                            setCol(idx, { variantId: e.target.value || null })
                          }
                        >
                          {opts.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {ROWS.map((r, ri) => {
            if ("section" in r && r.section)
              return (
                <div className="row section" key={`s-${ri}`}>
                  <div className="cell">{r.section}</div>
                  {cols.map((_, i) => (
                    <div className="cell" key={i} />
                  ))}
                </div>
              );
            // narrow to data row
            if (!("id" in r) || !r.id) return null;
            const dataRow = r as Extract<Row, { id: string }>;
            const bestIdx = dataRow.best ? findBestIdx(dataRow.id, dataRow.best) : -1;
            const isName = dataRow.id === "name";
            const isBrand = dataRow.id === "brand_name";
            return (
              <div
                key={dataRow.id}
                className={`row ${isName ? "name-row" : isBrand ? "brand-row" : ""}`}
              >
                <div className="cell">{dataRow.label}</div>
                {cols.map((c, idx) => {
                  const m = getModel(c);
                  const raw = value(dataRow.id, c);
                  const display = dataRow.fmt
                    ? dataRow.fmt(raw, c, m)
                    : raw == null
                      ? "—"
                      : String(raw);
                  const muted = raw == null && !c.brand ? "muted" : "";
                  const best = idx === bestIdx ? "best" : "";
                  return (
                    <div
                      className={`cell ${muted} ${best}`.trim()}
                      key={idx}
                    >
                      {display}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="cmp-legend">
        <span className="swatch" />
        <span>
          Az adott sor legjobb értéke (legalacsonyabb ár / legnagyobb
          csomagtartó / leghosszabb hatótáv / legnagyobb akku / legerősebb /
          legjobb Ft/km)
        </span>
      </div>
    </div>
  );
}
