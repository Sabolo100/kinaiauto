"use client";

import { useMemo, useState } from "react";
import type {
  Brand,
  Category,
  Drive,
  ModelRow,
  PriceBand,
} from "@/lib/types";
import { CATEGORY_SEGMENT } from "@/lib/format";
import { brandLogoUrl } from "@/lib/media-urls";
import { MobileFinder } from "./mobile-finder";
import { CAT_SHORT, CAT_ICON, CAT_ROW_ORDER } from "./cat-meta";
import { PriceSlider } from "./price-slider";

// ── View-toggle SVG icons ─────────────────────────────────────────────────────
function IconColView() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="4" height="15" rx="1.5"/>
      <rect x="5.5" y="0" width="4" height="15" rx="1.5"/>
      <rect x="11" y="0" width="4" height="15" rx="1.5"/>
    </svg>
  );
}
function IconRowView() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" aria-hidden>
      <rect x="0" y="0" width="15" height="4" rx="1.5"/>
      <rect x="0" y="5.5" width="15" height="4" rx="1.5"/>
      <rect x="0" y="11" width="15" height="4" rx="1.5"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export type FinderProps = {
  models: ModelRow[];
  brands: Brand[];
  categories: Category[];
  drives: Drive[];
  bands: PriceBand[];

  cats: Set<string>;
  prices: Set<string>;
  drv: Set<string>;
  brSel: Set<string>;
  priceRange: { min: number; max: number } | null;

  setCats: (v: Set<string>) => void;
  setPrices: (v: Set<string>) => void;
  setDrv: (v: Set<string>) => void;
  setBrSel: (v: Set<string>) => void;
  setPriceRange: (v: { min: number; max: number } | null) => void;

  resultCount: number;
};

export function Finder(p: FinderProps) {
  const [view, setView] = useState<"col" | "row">("row");

  const [absMin, absMax] = useMemo(() => {
    const min = Math.min(...p.models.map((m) => m.price_min_m_ft ?? 0));
    const max = Math.max(...p.models.map((m) => m.price_max_m_ft ?? 0));
    return [Math.floor(min * 10) / 10, Math.ceil(max * 10) / 10];
  }, [p.models]);

  function toggleSet(set: Set<string>, value: string): Set<string> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  // categories sorted by the custom row-view order
  const sortedCats = useMemo(
    () =>
      [...p.categories].sort(
        (a, b) =>
          (CAT_ROW_ORDER[a.slug] ?? 99) - (CAT_ROW_ORDER[b.slug] ?? 99),
      ),
    [p.categories],
  );

  const priceSliderProps = {
    absMin,
    absMax,
    value: p.priceRange,
    onChange: (r: { min: number; max: number } | null) => {
      if (r) { p.setPrices(new Set()); p.setPriceRange(r); }
      else    { p.setPriceRange(null); }
    },
    anyChip: p.prices.size > 0,
  };

  return (
    <section className="container" id="modellkereso">
      <div className="finder">
        <MobileFinder {...p} />
        <div className="finder-card finder-desktop">

          {/* ── Header ── */}
          <div className="finder-head">
            <div className="lbl">Modellkereső · élő szűrés</div>
            <div className="finder-view-toggle">
              <button
                type="button"
                className={`view-btn ${view === "col" ? "on" : ""}`}
                onClick={() => setView("col")}
                title="Hasáb nézet"
                aria-pressed={view === "col"}
              >
                <IconColView />
              </button>
              <button
                type="button"
                className={`view-btn ${view === "row" ? "on" : ""}`}
                onClick={() => setView("row")}
                title="Soros nézet"
                aria-pressed={view === "row"}
              >
                <IconRowView />
              </button>
            </div>
            <div className="count">
              <em>{p.resultCount}</em> találat
            </div>
          </div>

          {/* ══ COLUMN VIEW (existing) ══════════════════════════════════════ */}
          {view === "col" && (
            <div className="filter-cols">
              <div className="filter-col" data-grid="2">
                <h4>
                  <span className="num">01</span>Kategória
                </h4>
                <div className="chips">
                  <button
                    type="button"
                    className={`chip ${p.cats.size === 0 ? "on" : ""}`}
                    onClick={() => p.setCats(new Set())}
                  >
                    Összes
                  </button>
                  {p.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`chip ${p.cats.has(c.label_hu) ? "on" : ""}`}
                      onClick={() => p.setCats(toggleSet(p.cats, c.label_hu))}
                    >
                      {c.label_hu}{CATEGORY_SEGMENT[c.slug] ? ` (${CATEGORY_SEGMENT[c.slug]})` : ""}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-col" data-grid="2">
                <h4>
                  <span className="num">02</span>Ársáv (millió Ft)
                </h4>
                <div className="chips">
                  <button
                    type="button"
                    className={`chip ${p.prices.size === 0 && !p.priceRange ? "on" : ""}`}
                    onClick={() => { p.setPrices(new Set()); p.setPriceRange(null); }}
                  >
                    Összes
                  </button>
                  {p.bands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`chip ${p.prices.has(b.id) ? "on" : ""}`}
                      onClick={() => { p.setPriceRange(null); p.setPrices(toggleSet(p.prices, b.id)); }}
                    >
                      {b.label_hu}
                    </button>
                  ))}
                </div>
                <PriceSlider {...priceSliderProps} />
              </div>

              <div className="filter-col" data-grid="2">
                <h4>
                  <span className="num">03</span>Hajtásmód
                </h4>
                <div className="chips">
                  <button
                    type="button"
                    className={`chip ${p.drv.size === 0 ? "on" : ""}`}
                    onClick={() => p.setDrv(new Set())}
                  >
                    Összes
                  </button>
                  {p.drives.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`chip ${p.drv.has(d.label_hu) ? "on" : ""}`}
                      onClick={() => p.setDrv(toggleSet(p.drv, d.label_hu))}
                    >
                      {d.label_hu}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ ROW VIEW (new horizontal) ═══════════════════════════════════ */}
          {view === "row" && (
            <div className="filter-rows">

              {/* Row 1 — Hajtásmód */}
              <div className="filter-row-band">
                <div className="filter-row-chips">
                  <button
                    type="button"
                    className={`chip row-chip ${p.drv.size === 0 ? "on" : ""}`}
                    onClick={() => p.setDrv(new Set())}
                  >
                    Összes
                  </button>
                  {p.drives.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`chip row-chip ${p.drv.has(d.label_hu) ? "on" : ""}`}
                      onClick={() => p.setDrv(toggleSet(p.drv, d.label_hu))}
                    >
                      {d.label_hu}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2 — Ársáv */}
              <div className="filter-row-band">
                <div className="filter-row-chips">
                  <button
                    type="button"
                    className={`chip row-chip ${p.prices.size === 0 && !p.priceRange ? "on" : ""}`}
                    onClick={() => { p.setPrices(new Set()); p.setPriceRange(null); }}
                  >
                    Összes
                  </button>
                  {p.bands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      className={`chip row-chip ${p.prices.has(b.id) ? "on" : ""}`}
                      onClick={() => { p.setPriceRange(null); p.setPrices(toggleSet(p.prices, b.id)); }}
                    >
                      {b.label_hu}
                    </button>
                  ))}
                </div>
                <div className="filter-row-slider">
                  <PriceSlider {...priceSliderProps} />
                </div>
              </div>

              {/* Row 3 — Kategória with icons */}
              <div className="filter-row-band">
                <div className="filter-row-chips filter-row-chips--cat">
                  <button
                    type="button"
                    className={`cat-chip cat-chip--all ${p.cats.size === 0 ? "on" : ""}`}
                    onClick={() => p.setCats(new Set())}
                  >
                    <span className="cat-chip-name">Összes</span>
                  </button>
                  {sortedCats.map((c) => {
                    const short = CAT_SHORT[c.slug] ?? c.label_hu;
                    const icon  = CAT_ICON[c.slug];
                    const isOn  = p.cats.has(c.label_hu);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`cat-chip ${isOn ? "on" : ""}`}
                        onClick={() => p.setCats(toggleSet(p.cats, c.label_hu))}
                      >
                        {icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={icon}
                            alt=""
                            aria-hidden
                            className="cat-chip-icon"
                          />
                        ) : (
                          <span className="cat-chip-icon-placeholder" />
                        )}
                        <span className="cat-chip-name">{short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ── Brand bar (both views) ── */}
          <div className="brandbar">
            <div className="brandbar-chips">
              <button
                type="button"
                className={`brand-chip ${p.brSel.size === 0 ? "on" : ""}`}
                onClick={() => p.setBrSel(new Set())}
              >
                Összes
              </button>
              {[...p.brands]
                .sort((a, b) => a.name.localeCompare(b.name, "hu"))
                .map((b) => {
                  const logo = brandLogoUrl(b.logo_path);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`brand-chip ${p.brSel.has(b.name) ? "on" : ""}`}
                      onClick={() => p.setBrSel(toggleSet(p.brSel, b.name))}
                    >
                      {logo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logo} alt="" aria-hidden className="brand-chip-logo" />
                      )}
                      <span className="brand-chip-name">{b.name}</span>
                    </button>
                  );
                })
              }
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

