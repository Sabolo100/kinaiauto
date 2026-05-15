"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Brand,
  Category,
  Drive,
  ModelRow,
  PriceBand,
} from "@/lib/types";
import { fmtMFt, CATEGORY_SEGMENT } from "@/lib/format";
import { brandLogoUrl } from "@/lib/data";

// ── Category metadata for the horizontal "row" view ──────────────────────────
const CAT_SHORT: Record<string, string> = {
  "varosi-kisauto":   "Kisautó",
  "mini-suv":         "Mini SUV",
  "kompakt-suv":      "Kompakt SUV",
  "kozepmeretu-suv":  "Közép SUV",
  "nagy-suv":         "Nagy SUV",
  "kompakt-ferdehatu":"Ferdehátú",
  "kombi":            "Kombi",
  "sedan":            "Szedán",
  "premium-limuzin":  "Limuzin",
  "mpv":              "Egyterű",
  "roadster":         "Roadster",
  "pickup":           "Pickup",
};

// icon-number matches the user-specified order (1=Kisautó … 12=Pickup)
const CAT_ICON: Record<string, string> = {
  "varosi-kisauto":   "/cat-icons/1varosikisauto.png",
  "mini-suv":         "/cat-icons/2MiniSuv.png",
  "kompakt-suv":      "/cat-icons/3KompaktSUV.png",
  "kozepmeretu-suv":  "/cat-icons/4KozepSuv.png",
  "nagy-suv":         "/cat-icons/5NagySuv.png",
  "kompakt-ferdehatu":"/cat-icons/6Ferdehatu.png",
  "kombi":            "/cat-icons/7Sedan.png",
  "sedan":            "/cat-icons/8Kombi.png",
  "premium-limuzin":  "/cat-icons/9Limuzin.png",
  "mpv":              "/cat-icons/10Egyteru.png",
  "roadster":         "/cat-icons/11Roadster.png",
  "pickup":           "/cat-icons/12PickUp.png",
};

const CAT_ROW_ORDER: Record<string, number> = {
  "varosi-kisauto": 1, "mini-suv": 2, "kompakt-suv": 3,
  "kozepmeretu-suv": 4, "nagy-suv": 5, "kompakt-ferdehatu": 6,
  "kombi": 7, "sedan": 8, "premium-limuzin": 9,
  "mpv": 10, "roadster": 11, "pickup": 12,
};

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

type Props = {
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

export function Finder(p: Props) {
  const [view, setView] = useState<"col" | "row">("col");

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
        <div className="finder-card">

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

// ── PriceSlider (unchanged) ───────────────────────────────────────────────────
function PriceSlider({
  absMin,
  absMax,
  value,
  onChange,
  anyChip,
}: {
  absMin: number;
  absMax: number;
  value: { min: number; max: number } | null;
  onChange: (v: { min: number; max: number } | null) => void;
  anyChip: boolean;
}) {
  const [lo, setLo] = useState(value?.min ?? absMin);
  const [hi, setHi] = useState(value?.max ?? absMax);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<"lo" | "hi" | "range" | null>(null);
  const dragStart = useRef<{ x: number; lo: number; hi: number }>({ x: 0, lo: 0, hi: 0 });
  const MIN_GAP = 0.5;
  const span = absMax - absMin;

  useEffect(() => {
    if (!value) { setLo(absMin); setHi(absMax); }
    else        { setLo(value.min); setHi(value.max); }
  }, [value, absMin, absMax]);

  const active = !(lo === absMin && hi === absMax);

  function pct(v: number): number { return ((v - absMin) / span) * 100; }
  function clamp(v: number, mn: number, mx: number) { return Math.max(mn, Math.min(mx, v)); }
  function valueFromX(clientX: number) {
    const w = wrap.current?.getBoundingClientRect();
    if (!w) return absMin;
    return Math.round((absMin + ((clientX - w.left) / w.width) * span) * 10) / 10;
  }
  function commit(nextLo: number, nextHi: number) {
    const a = nextLo === absMin && nextHi === absMax;
    onChange(a ? null : { min: nextLo, max: nextHi });
  }
  function startDrag(target: "lo" | "hi" | "range", e: React.PointerEvent) {
    e.preventDefault(); e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = target;
    dragStart.current = { x: e.clientX, lo, hi };
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const w = wrap.current?.getBoundingClientRect();
    if (!w) return;
    const dx = ((e.clientX - dragStart.current.x) / w.width) * span;
    if (drag.current === "lo") {
      const next = clamp(Math.round((dragStart.current.lo + dx) * 10) / 10, absMin, hi - MIN_GAP);
      setLo(next); commit(next, hi);
    } else if (drag.current === "hi") {
      const next = clamp(Math.round((dragStart.current.hi + dx) * 10) / 10, lo + MIN_GAP, absMax);
      setHi(next); commit(lo, next);
    } else {
      const width = dragStart.current.hi - dragStart.current.lo;
      let nextLo = clamp(Math.round((dragStart.current.lo + dx) * 10) / 10, absMin, absMax - width);
      const nextHi = Math.round((nextLo + width) * 10) / 10;
      setLo(nextLo); setHi(nextHi); commit(nextLo, nextHi);
    }
  }
  function endDrag() { drag.current = null; }
  function handleTrackClick(e: React.PointerEvent) {
    if (e.target !== wrap.current) return;
    const v = valueFromX(e.clientX);
    if (Math.abs(v - lo) < Math.abs(v - hi)) {
      const next = clamp(v, absMin, hi - MIN_GAP); setLo(next); commit(next, hi);
    } else {
      const next = clamp(v, lo + MIN_GAP, absMax); setHi(next); commit(lo, next);
    }
  }
  function reset() { setLo(absMin); setHi(absMax); onChange(null); }

  return (
    <div className={`price-slider ${active ? "active" : ""}`} aria-label="Ársáv finomhangolása">
      <div className="ps-readout">
        <span className="ps-mode">
          {active ? "Egyedi ársáv · csúszka" : anyChip ? "Sávok kiválasztva" : "Teljes ársáv"}
        </span>
        <span className="ps-vals">
          {active ? <em>{fmtMFt(lo)} — {fmtMFt(hi)}</em> : <>{fmtMFt(absMin)} — {fmtMFt(absMax)}</>}{" "}M Ft
        </span>
      </div>
      <div ref={wrap} className="ps-track-wrap" onPointerDown={handleTrackClick}>
        <div className="ps-track" />
        <div
          className="ps-range"
          style={{ left: `${pct(lo)}%`, width: `${pct(hi) - pct(lo)}%` }}
          onPointerDown={(e) => startDrag("range", e)}
          onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        />
        <div
          className="ps-handle ps-handle--lo" tabIndex={0} role="slider"
          aria-label="Minimum ár" aria-valuemin={absMin} aria-valuemax={absMax} aria-valuenow={lo}
          style={{ left: `${pct(lo)}%` }}
          onPointerDown={(e) => startDrag("lo", e)}
          onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 1 : 0.1;
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              const n = clamp(Math.round((lo - step) * 10) / 10, absMin, hi - MIN_GAP);
              setLo(n); commit(n, hi);
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              const n = clamp(Math.round((lo + step) * 10) / 10, absMin, hi - MIN_GAP);
              setLo(n); commit(n, hi);
            }
          }}
        />
        <div
          className="ps-handle ps-handle--hi" tabIndex={0} role="slider"
          aria-label="Maximum ár" aria-valuemin={absMin} aria-valuemax={absMax} aria-valuenow={hi}
          style={{ left: `${pct(hi)}%` }}
          onPointerDown={(e) => startDrag("hi", e)}
          onPointerMove={onMove} onPointerUp={endDrag} onPointerCancel={endDrag}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 1 : 0.1;
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              const n = clamp(Math.round((hi - step) * 10) / 10, lo + MIN_GAP, absMax);
              setHi(n); commit(lo, n);
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              const n = clamp(Math.round((hi + step) * 10) / 10, lo + MIN_GAP, absMax);
              setHi(n); commit(lo, n);
            }
          }}
        />
      </div>
      <div className="ps-ends">
        <span>{fmtMFt(absMin)} M</span>
        <button type="button" className={`ps-reset ${active ? "" : "hidden"}`} onClick={reset}>
          Visszaállítás
        </button>
        <span>{fmtMFt(absMax)} M</span>
      </div>
    </div>
  );
}
