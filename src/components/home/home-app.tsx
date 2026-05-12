"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  ArrowDownUp,
  GitCompareArrows,
  Grid2x2,
  LayoutGrid,
  Rows3,
} from "lucide-react";
import type {
  Brand,
  Category,
  Drive,
  ModelRow,
  PriceBand,
} from "@/lib/types";
import { fmtPrice } from "@/lib/format";
import { ModelCard } from "@/components/model-card";
import { CompareProvider, useCompare } from "@/components/compare-context";
import { CompareBar } from "@/components/compare-bar";
import { Hero } from "./hero";
import { Finder } from "./finder";
import { Visualization } from "./visualization";
import "./home.css";

type Props = {
  models: ModelRow[];
  brands: Brand[];
  categories: Category[];
  drives: Drive[];
  bands: PriceBand[];
};

export function HomeApp(props: Props) {
  return (
    <CompareProvider>
      <HomeAppInner {...props} />
      <CompareBar />
    </CompareProvider>
  );
}

function HomeAppInner({ models, brands, categories, drives, bands }: Props) {
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [prices, setPrices] = useState<Set<string>>(new Set());
  const [drv, setDrv] = useState<Set<string>>(new Set());
  const [brSel, setBrSel] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [zoom, setZoom] = useState<1 | 2 | 3>(2);
  const [sort, setSort] = useState<string>("priceMin");
  const compare = useCompare();

  const filtered = useMemo(() => {
    return models.filter((m) => {
      if (cats.size && !cats.has(m.category)) return false;
      if (brSel.size && !brSel.has(m.brand_name)) return false;
      if (drv.size && !drv.has(m.drive)) return false;
      const pmin = m.price_min_m_ft ?? 0;
      const pmax = m.price_max_m_ft ?? 0;
      if (priceRange) {
        if (pmin > priceRange.max || pmax < priceRange.min) return false;
      } else if (prices.size) {
        const hit = [...prices].some((id) => {
          const b = bands.find((x) => x.id === id);
          if (!b) return false;
          return pmin <= b.max_m_ft && pmax >= b.min_m_ft;
        });
        if (!hit) return false;
      }
      return true;
    });
  }, [models, cats, brSel, drv, prices, priceRange, bands]);

  const sorted = useMemo(() => {
    const [k, dir] = sort.endsWith("-desc")
      ? [sort.replace("-desc", ""), -1]
      : [sort, 1];
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = (a as Record<string, unknown>)[mapSortKey(k)] ?? 0;
      const bv = (b as Record<string, unknown>)[mapSortKey(k)] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return dir * av.localeCompare(bv, "hu");
      }
      return dir * (((av as number) || 0) - ((bv as number) || 0));
    });
    return arr;
  }, [filtered, sort]);

  return (
    <>
      <Hero
        modelsCount={models.length}
        brandsCount={new Set(models.map((m) => m.brand_name)).size}
      />

      <Finder
        models={models}
        brands={brands}
        categories={categories}
        drives={drives}
        bands={bands}
        cats={cats}
        prices={prices}
        drv={drv}
        brSel={brSel}
        priceRange={priceRange}
        setCats={setCats}
        setPrices={setPrices}
        setDrv={setDrv}
        setBrSel={setBrSel}
        setPriceRange={setPriceRange}
        resultCount={filtered.length}
      />

      {/* Cards block */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">04 · Modellek</div>
              <h2>Válaszd ki, melyik tetszik!</h2>
            </div>
          </div>

          {/* Active filter summary */}
          {(cats.size > 0 || drv.size > 0 || brSel.size > 0 || prices.size > 0 || priceRange) && (
            <div className="active-filters">
              <span className="af-label">Szűrők:</span>
              <FilterPill
                label="Kategória"
                selected={[...cats]}
                options={categories.map((c) => c.label_hu)}
                onToggle={(v) => setCats((p) => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n; })}
                onClear={() => setCats(new Set())}
              />
              <FilterPill
                label="Hajtás"
                selected={[...drv]}
                options={drives.map((d) => d.label_hu)}
                onToggle={(v) => setDrv((p) => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n; })}
                onClear={() => setDrv(new Set())}
              />
              <FilterPill
                label="Márka"
                selected={[...brSel]}
                options={brands.map((b) => b.name)}
                onToggle={(v) => setBrSel((p) => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n; })}
                onClear={() => setBrSel(new Set())}
              />
              <FilterPill
                label="Ár"
                selected={[...prices].map((id) => bands.find((b) => b.id === id)?.label_hu ?? id)}
                options={bands.map((b) => b.label_hu)}
                onToggle={(v) => {
                  const band = bands.find((b) => b.label_hu === v);
                  if (!band) return;
                  setPrices((p) => { const n = new Set(p); n.has(band.id) ? n.delete(band.id) : n.add(band.id); return n; });
                }}
                onClear={() => setPrices(new Set())}
              />
              {priceRange && (
                <div className="fpill-wrap">
                  <div className="fpill">
                    <span className="fpill-k">Ár</span>
                    <span className="fpill-v">{priceRange.min}–{priceRange.max} M Ft</span>
                    <button className="fpill-x" onClick={() => setPriceRange(null)} aria-label="Szűrő törlése">×</button>
                  </div>
                </div>
              )}
              <button
                className="af-clear-all"
                onClick={() => { setCats(new Set()); setDrv(new Set()); setBrSel(new Set()); setPrices(new Set()); setPriceRange(null); }}
              >
                Összes törlése
              </button>
            </div>
          )}

          <div className="grid-controls">
            <div className="left">
              <div className="zoom-toggle">
                <button
                  type="button"
                  data-z="1"
                  className={zoom === 1 ? "on" : undefined}
                  onClick={() => setZoom(1)}
                >
                  <Grid2x2 size={14} /> Áttekintő
                </button>
                <button
                  type="button"
                  data-z="2"
                  className={zoom === 2 ? "on" : undefined}
                  onClick={() => setZoom(2)}
                >
                  <LayoutGrid size={14} /> Alap
                </button>
                <button
                  type="button"
                  data-z="3"
                  className={zoom === 3 ? "on" : undefined}
                  onClick={() => setZoom(3)}
                >
                  <Rows3 size={14} /> Részletes
                </button>
              </div>
              <div className="sort-select">
                <ArrowDownUp size={14} style={{ color: "var(--ink-mute)" }} />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Rendezés"
                >
                  <option value="priceMin">Rendezés: Ár szerint (növekvő)</option>
                  <option value="priceMax-desc">Ár szerint (csökkenő)</option>
                  <option value="length-desc">Hossz szerint</option>
                  <option value="trunk-desc">Csomagtartó szerint</option>
                  <option value="range-desc">Hatótáv szerint</option>
                  <option value="power-desc">Teljesítmény szerint</option>
                  <option value="brand">Márkanév szerint</option>
                </select>
              </div>
            </div>
            <div
              className="mono"
              style={{ fontSize: 11.5, color: "var(--ink-mute)" }}
            >
              {filtered.length} találat · {brands.length} márka
            </div>
          </div>
          {sorted.length === 0 ? (
            <div
              style={{
                padding: "64px 24px",
                textAlign: "center",
                color: "var(--ink-soft)",
                fontFamily: "var(--font-instrument), serif",
                fontSize: 24,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 6,
              }}
            >
              Nincs találat — próbálj szűkíteni a szűrőkön.
            </div>
          ) : (
            <div className={`cards zoom-${zoom}`}>
              {sorted.map((m) => (
                <ModelCard
                  key={m.id}
                  model={m}
                  zoom={zoom}
                  isSelected={compare.has({
                    brand: m.brand_name,
                    name: m.name,
                  })}
                  onToggleCompare={() =>
                    compare.toggle({
                      brand: m.brand_name,
                      name: m.name,
                    })
                  }
                  hideTags={{
                    category: cats.size > 0,
                    drive: drv.size > 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Visualization */}
      <section className="block">
        <div className="container">
          <div className="block-head">
            <div>
              <div className="step">05 · Kínálat-vizualizáció</div>
              <h2>
                Lásd a <em>különbségek</em> méretét.
              </h2>
              <p className="sub">
                A szűrt modellek egy számegyenesen helyezkednek el. Két autó ára
                közelebb van, mint hinnéd? Egy modell csomagtartója kiugró? Itt
                szemmel láthatóvá válnak az arányok.
              </p>
            </div>
          </div>
          <Visualization models={filtered} />
        </div>
      </section>

      <div style={{ marginTop: 8, marginBottom: 16, textAlign: "center" }}>
        <Link
          href="/kinalat"
          className="btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 22px",
            border: "1px solid var(--ink)",
            borderRadius: 999,
            background: "var(--ink)",
            color: "#fff",
            fontSize: 14,
          }}
        >
          <GitCompareArrows size={14} /> Részletesebb függőleges nézethez →
          Kínálat
        </Link>
      </div>
    </>
  );
}

function FilterPill({
  label,
  selected,
  options,
  onToggle,
  onClear,
}: {
  label: string;
  selected: string[];
  options: string[];
  onToggle: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (!selected.length) return null;

  const handleEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div className="fpill-wrap" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <div className="fpill">
        <span className="fpill-k">{label}:</span>
        <span className="fpill-v">{selected.join(", ")}</span>
        <button
          className="fpill-x"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          aria-label={`${label} szűrő törlése`}
        >×</button>
      </div>
      {open && (
        <div className="fpill-dd">
          {options.map((opt) => {
            const on = selected.includes(opt);
            return (
              <button
                key={opt}
                className={`fpill-opt ${on ? "on" : ""}`}
                onClick={() => onToggle(opt)}
              >
                <span className="fpill-check">{on ? "✓" : ""}</span>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function mapSortKey(k: string): string {
  // map UI sort keys to ModelRow column names
  return (
    {
      priceMin: "price_min_m_ft",
      priceMax: "price_max_m_ft",
      length: "length_mm",
      trunk: "trunk_l",
      range: "range_km",
      power: "power_hp",
      brand: "brand_name",
    } as Record<string, string>
  )[k] ?? k;
}
