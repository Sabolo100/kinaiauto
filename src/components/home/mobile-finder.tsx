"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Check, RotateCcw } from "lucide-react";
import { brandLogoUrl } from "@/lib/media-urls";
import { BottomSheet } from "@/components/app-shell/bottom-sheet";
import type { FinderProps } from "./finder";
import { CAT_ICON, CAT_ROW_ORDER, CAT_SHORT } from "./cat-meta";
import { PriceSlider } from "./price-slider";

/**
 * Phone version of the model finder:
 *  - sticky bar: "Szűrők" button (with active count) + live result count
 *  - horizontal category rail (icons) and drive/price rail
 *  - full filter set in a bottom sheet with an "apply" CTA
 * Shares all state with the desktop Finder — only the presentation differs.
 */
export function MobileFinder(p: FinderProps) {
  const [open, setOpen] = useState(false);

  const [absMin, absMax] = useMemo(() => {
    const min = Math.min(...p.models.map((m) => m.price_min_m_ft ?? 0));
    const max = Math.max(...p.models.map((m) => m.price_max_m_ft ?? 0));
    return [Math.floor(min * 10) / 10, Math.ceil(max * 10) / 10];
  }, [p.models]);

  const sortedCats = useMemo(
    () => [...p.categories].sort((a, b) => (CAT_ROW_ORDER[a.slug] ?? 99) - (CAT_ROW_ORDER[b.slug] ?? 99)),
    [p.categories],
  );
  const sortedBrands = useMemo(
    () => [...p.brands].sort((a, b) => a.name.localeCompare(b.name, "hu")),
    [p.brands],
  );

  function toggle(set: Set<string>, v: string) {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    return n;
  }
  function resetAll() {
    p.setCats(new Set()); p.setDrv(new Set()); p.setBrSel(new Set());
    p.setPrices(new Set()); p.setPriceRange(null);
  }

  const activeCount =
    p.cats.size + p.drv.size + p.brSel.size + (p.priceRange ? 1 : p.prices.size);

  return (
    <div className="finder-mobile" id="modellkereso-mobil">
      {/* Sticky action bar */}
      <div className="mf-bar">
        <button type="button" className="mf-filter-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <SlidersHorizontal size={16} />
          Szűrők
          {activeCount > 0 ? <span className="n">{activeCount}</span> : null}
        </button>
        {activeCount > 0 && (
          <button type="button" className="mf-clear" onClick={resetAll}>Törlés</button>
        )}
        <div className="mf-count" aria-live="polite">
          <em>{p.resultCount}</em><small>modell</small>
        </div>
      </div>

      {/* Category rail */}
      <div className="mf-rail mf-rail--cats" role="group" aria-label="Kategória">
        <button
          type="button"
          className={`mf-cat mf-cat--all ${p.cats.size === 0 ? "on" : ""}`}
          onClick={() => p.setCats(new Set())}
        >
          <span style={{ height: 26, display: "flex", alignItems: "center", fontSize: 18 }}>∞</span>
          <span>Összes</span>
        </button>
        {sortedCats.map((c) => {
          const on = p.cats.has(c.label_hu);
          const icon = CAT_ICON[c.slug];
          return (
            <button
              key={c.id}
              type="button"
              className={`mf-cat ${on ? "on" : ""}`}
              aria-pressed={on}
              onClick={() => p.setCats(toggle(p.cats, c.label_hu))}
            >
              {icon ? <img src={icon} alt="" aria-hidden /> : <span style={{ height: 26 }} />}
              <span>{CAT_SHORT[c.slug] ?? c.label_hu}</span>
            </button>
          );
        })}
      </div>

      {/* Drive + price rail */}
      <div className="mf-rail" role="group" aria-label="Hajtás és ársáv">
        {p.drives.map((d) => {
          const on = p.drv.has(d.label_hu);
          return (
            <button key={d.id} type="button" className={`mf-chip ${on ? "on" : ""}`} aria-pressed={on}
              onClick={() => p.setDrv(toggle(p.drv, d.label_hu))}>
              {on && <Check size={13} />}{d.label_hu}
            </button>
          );
        })}
        <span className="mf-sep" aria-hidden />
        {p.bands.map((b) => {
          const on = p.prices.has(b.id);
          return (
            <button key={b.id} type="button" className={`mf-chip ${on ? "on" : ""}`} aria-pressed={on}
              onClick={() => { p.setPriceRange(null); p.setPrices(toggle(p.prices, b.id)); }}>
              {on && <Check size={13} />}{b.label_hu}
            </button>
          );
        })}
      </div>

      {/* Full filter sheet */}
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Szűrők"
        size="full"
        footer={
          <div className="mfs-foot">
            <button type="button" className="mfs-reset" onClick={resetAll} aria-label="Szűrők törlése">
              <RotateCcw size={16} />
            </button>
            <button type="button" className="mfs-apply" onClick={() => setOpen(false)}>
              Mutasd: <em>{p.resultCount}</em> modell
            </button>
          </div>
        }
      >
        <section className="mfs-section">
          <h4 className="mfs-h"><span className="num">01</span>Hajtásmód
            {p.drv.size > 0 && <span className="sel">{p.drv.size} kiválasztva</span>}
          </h4>
          <div className="mfs-chips">
            <button type="button" className={`chip ${p.drv.size === 0 ? "on" : ""}`} onClick={() => p.setDrv(new Set())}>Összes</button>
            {p.drives.map((d) => (
              <button key={d.id} type="button" className={`chip ${p.drv.has(d.label_hu) ? "on" : ""}`}
                onClick={() => p.setDrv(toggle(p.drv, d.label_hu))}>{d.label_hu}</button>
            ))}
          </div>
        </section>

        <section className="mfs-section">
          <h4 className="mfs-h"><span className="num">02</span>Ársáv (millió Ft)
            {(p.prices.size > 0 || p.priceRange) && <span className="sel">aktív</span>}
          </h4>
          <div className="mfs-chips">
            <button type="button" className={`chip ${p.prices.size === 0 && !p.priceRange ? "on" : ""}`}
              onClick={() => { p.setPrices(new Set()); p.setPriceRange(null); }}>Összes</button>
            {p.bands.map((b) => (
              <button key={b.id} type="button" className={`chip ${p.prices.has(b.id) ? "on" : ""}`}
                onClick={() => { p.setPriceRange(null); p.setPrices(toggle(p.prices, b.id)); }}>{b.label_hu}</button>
            ))}
          </div>
          <div className="mfs-slider">
            <PriceSlider
              absMin={absMin}
              absMax={absMax}
              value={p.priceRange}
              anyChip={p.prices.size > 0}
              onChange={(r) => { if (r) { p.setPrices(new Set()); p.setPriceRange(r); } else p.setPriceRange(null); }}
            />
          </div>
        </section>

        <section className="mfs-section">
          <h4 className="mfs-h"><span className="num">03</span>Kategória
            {p.cats.size > 0 && <span className="sel">{p.cats.size} kiválasztva</span>}
          </h4>
          <div className="mfs-cats">
            <button type="button" className={`mfs-cat ${p.cats.size === 0 ? "on" : ""}`} onClick={() => p.setCats(new Set())}>
              <span style={{ height: 26, display: "flex", alignItems: "center", fontSize: 18 }}>∞</span>
              <span>Összes</span>
            </button>
            {sortedCats.map((c) => {
              const on = p.cats.has(c.label_hu);
              const icon = CAT_ICON[c.slug];
              return (
                <button key={c.id} type="button" className={`mfs-cat ${on ? "on" : ""}`} aria-pressed={on}
                  onClick={() => p.setCats(toggle(p.cats, c.label_hu))}>
                  {icon ? <img src={icon} alt="" aria-hidden /> : <span style={{ height: 26 }} />}
                  <span>{CAT_SHORT[c.slug] ?? c.label_hu}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mfs-section">
          <h4 className="mfs-h"><span className="num">04</span>Márka
            {p.brSel.size > 0 && <span className="sel">{p.brSel.size} kiválasztva</span>}
          </h4>
          <div className="mfs-brands">
            <button type="button" className={`mfs-brand ${p.brSel.size === 0 ? "on" : ""}`} onClick={() => p.setBrSel(new Set())}>
              <span style={{ height: 20, display: "flex", alignItems: "center", fontSize: 16 }}>∞</span>
              <span>Összes</span>
            </button>
            {sortedBrands.map((b) => {
              const on = p.brSel.has(b.name);
              const logo = brandLogoUrl(b.logo_path);
              return (
                <button key={b.id} type="button" className={`mfs-brand ${on ? "on" : ""}`} aria-pressed={on}
                  onClick={() => p.setBrSel(toggle(p.brSel, b.name))}>
                  {logo ? <img src={logo} alt="" aria-hidden /> : <span style={{ height: 20 }} />}
                  <span>{b.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      </BottomSheet>
    </div>
  );
}
