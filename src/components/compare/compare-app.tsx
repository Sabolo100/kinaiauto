"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import type { ModelRow } from "@/lib/types";
import { fmtPrice, parseCompareTokens } from "@/lib/format";
import { photoUrl } from "@/lib/data";
import "./compare.css";

const TRIMS = ["Comfort", "Style", "Lounge"] as const;
type Trim = (typeof TRIMS)[number];

type Col = { brand: string; model: string; trim: Trim };

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
  { id: "trim", label: "Felszereltség" },
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
    const initial = tokens.map((t) => ({
      brand: t.brand,
      model: t.name,
      trim: "Style" as Trim,
    }));
    while (initial.length < 4)
      initial.push({ brand: "", model: "", trim: "Style" });
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

  function value(rowId: string, c: Col): unknown {
    if (rowId === "trim") return c.trim;
    const m = getModel(c);
    if (!m) return null;
    if (rowId === "valuePerKm") {
      if (m.price_min_m_ft && m.range_km) {
        return (m.price_min_m_ft * 1_000_000) / m.range_km;
      }
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
      prev.map((c, i) =>
        i === idx
          ? patch.brand !== undefined && patch.brand !== c.brand
            ? { brand: patch.brand, model: "", trim: "Style" }
            : { ...c, ...patch }
          : c,
      ),
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
              setCols(cols.map(() => ({ brand: "", model: "", trim: "Style" })))
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
                      setCol(idx, { brand: "", model: "", trim: "Style" })
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
                    <label>Felszereltség</label>
                    <select
                      value={c.trim}
                      disabled={!c.model}
                      onChange={(e) =>
                        setCol(idx, { trim: e.target.value as Trim })
                      }
                    >
                      {TRIMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
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
