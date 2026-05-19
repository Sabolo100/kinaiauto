"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  BatteryCharging,
  GitCompareArrows,
  Package,
  Route,
  Ruler,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import type {
  Brand,
  Category,
  Drive,
  ModelEngineOption,
  ModelRow,
  PriceBand,
} from "@/lib/types";
import { fmtPrice, catLabel } from "@/lib/format";
import { photoUrl } from "@/lib/data";
import "./catalog.css";

// ── Category metadata (mirrors homepage finder) ───────────────────────────────
const CAT_SHORT: Record<string, string> = {
  "varosi-kisauto":    "Kisautó",
  "mini-suv":          "Mini SUV",
  "kompakt-suv":       "Kompakt SUV",
  "kozepmeretu-suv":   "Közép SUV",
  "nagy-suv":          "Nagy SUV",
  "kompakt-ferdehatu": "Ferdehátú",
  "kombi":             "Kombi",
  "sedan":             "Szedán",
  "premium-limuzin":   "Limuzin",
  "mpv":               "Egyterű",
  "roadster":          "Roadster",
  "pickup":            "Pickup",
};
const CAT_ICON: Record<string, string> = {
  "varosi-kisauto":    "/cat-icons/1varosikisauto.png",
  "mini-suv":          "/cat-icons/2MiniSuv.png",
  "kompakt-suv":       "/cat-icons/3KompaktSUV.png",
  "kozepmeretu-suv":   "/cat-icons/4KozepSuv.png",
  "nagy-suv":          "/cat-icons/5NagySuv.png",
  "kompakt-ferdehatu": "/cat-icons/6Ferdehatu.png",
  "kombi":             "/cat-icons/7Sedan.png",
  "sedan":             "/cat-icons/8Kombi.png",
  "premium-limuzin":   "/cat-icons/9Limuzin.png",
  "mpv":               "/cat-icons/10Egyteru.png",
  "roadster":          "/cat-icons/11Roadster.png",
  "pickup":            "/cat-icons/12PickUp.png",
};
const CAT_ORDER: Record<string, number> = {
  "varosi-kisauto": 1, "mini-suv": 2, "kompakt-suv": 3,
  "kozepmeretu-suv": 4, "nagy-suv": 5, "kompakt-ferdehatu": 6,
  "kombi": 7, "sedan": 8, "premium-limuzin": 9,
  "mpv": 10, "roadster": 11, "pickup": 12,
};

// ─── Desktop chart layout constants ──────────────────────────────────────────
const AXIS_X  = 90;
const CARD_H  = 60;
const CARD_W  = 200;
const H_GAP   = 10;
const V_GAP   = 14;
const GRP_GAP = 22;
const CARDS_X = 128;
const TOP_PAD = 24;
const BOT_PAD = 64;

type Param = "priceMin" | "range" | "length" | "trunk" | "battery" | "power" | "seats";

// `variantCol` maps each chart parameter to the corresponding column on
// ModelEngineOption. If null, the parameter is *not* variant-specific
// (e.g. price, length), so the model is rendered once with its base value.
const PARAMS: {
  id: Param;
  label: string;
  col: keyof ModelRow;
  variantCol: keyof ModelEngineOption | null;
  icon: React.ReactNode;
  fmt: (v: number) => string;
}[] = [
  { id: "priceMin", label: "Ár",           col: "price_min_m_ft", variantCol: null,           icon: <Banknote size={13} />,        fmt: (v) => v.toFixed(1).replace(".", ",") + " M Ft" },
  { id: "range",    label: "Hatótáv",      col: "range_km",       variantCol: "range_km",     icon: <Route size={13} />,           fmt: (v) => `${Math.round(v)} km` },
  { id: "length",   label: "Hossz",        col: "length_mm",      variantCol: null,           icon: <Ruler size={13} />,           fmt: (v) => `${Math.round(v)} mm` },
  { id: "trunk",    label: "Csomagtartó",  col: "trunk_l",        variantCol: "trunk_l",      icon: <Package size={13} />,         fmt: (v) => `${Math.round(v)} l` },
  { id: "battery",  label: "Akku",         col: "battery_kwh",    variantCol: "battery_kwh",  icon: <BatteryCharging size={13} />, fmt: (v) => (Math.round(v * 10) / 10).toString().replace(".", ",") + " kWh" },
  { id: "power",    label: "Teljesítmény", col: "power_hp",       variantCol: "power_hp",     icon: <Zap size={13} />,             fmt: (v) => `${Math.round(v)} LE` },
  { id: "seats",    label: "Ülőhelyek",    col: "seats",          variantCol: "seats",        icon: <Users size={13} />,           fmt: (v) => `${Math.round(v)} fő` },
];

// A single render entry on the chart. When a model has multiple distinct
// values for the active parameter (via its engine variants), it produces
// multiple RenderCards — one per distinct value, each with the variant name.
type RenderCard = {
  key: string;                // unique React key
  model: ModelRow;
  value: number;
  variantName: string | null; // null → no suffix shown
};

function buildRenderCards(
  models: ModelRow[],
  param: (typeof PARAMS)[number],
): RenderCard[] {
  const out: RenderCard[] = [];
  for (const m of models) {
    const opts = m.engine_options ?? [];
    const variantCol = param.variantCol;

    // No variant-mapping for this param (price, length) — render once.
    if (!variantCol || opts.length === 0) {
      const v = m[param.col] as number | null;
      if (v != null) out.push({ key: m.id, model: m, value: v, variantName: null });
      continue;
    }

    // Group variants by distinct value (keep first variant name per value).
    const byValue = new Map<number, string>();
    for (const o of opts) {
      const v = o[variantCol] as number | null;
      if (v == null) continue;
      if (!byValue.has(v)) byValue.set(v, o.name);
    }

    if (byValue.size === 0) {
      // Variants exist but none have a value here → fall back to model field.
      const v = m[param.col] as number | null;
      if (v != null) out.push({ key: m.id, model: m, value: v, variantName: null });
    } else if (byValue.size === 1) {
      // All variants share one value → single render, no suffix.
      const [v] = [...byValue.entries()][0];
      out.push({ key: m.id, model: m, value: v, variantName: null });
    } else {
      // Multiple distinct values → one render per value, with variant suffix.
      for (const [v, name] of byValue.entries()) {
        out.push({
          key: `${m.id}__${name}__${v}`,
          model: m,
          value: v,
          variantName: name,
        });
      }
    }
  }
  return out;
}

type Props = {
  models: ModelRow[];
  brands: Brand[];
  categories: Category[];
  drives: Drive[];
  bands: PriceBand[];
  initialCategory?: string;
  initialDrive?: string;
};

export function CatalogApp({
  models, brands, categories, drives, bands, initialCategory, initialDrive,
}: Props) {
  const [prices,  setPrices]  = useState<Set<string>>(new Set());
  const [cats,    setCats]    = useState<Set<string>>(initialCategory ? new Set([initialCategory]) : new Set());
  const [drvSel,  setDrvSel]  = useState<Set<string>>(initialDrive   ? new Set([initialDrive])   : new Set());
  const [brSel,   setBrSel]   = useState<Set<string>>(new Set());
  const [param,   setParam]   = useState<Param>("priceMin");
  const [pinned,  setPinned]  = useState<ModelRow | null>(null);
  const [hovered, setHovered] = useState<ModelRow | null>(null);

  // ── Preload all thumbnails on mount ─────────────────────────────────────────
  // Model data is already on the client (prop). Triggering Image() downloads
  // caches all ~60–100 thumbnails so scrolling through the list is instant.
  useEffect(() => {
    models.forEach((m) => {
      const src = photoUrl(m.primary_photo_path);
      if (src) {
        const img = new window.Image();
        img.src = src;
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSet(s: Set<string>, v: string): Set<string> {
    const n = new Set(s);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  }

  const sortedCats = useMemo(
    () => [...categories].sort((a, b) => (CAT_ORDER[a.slug] ?? 99) - (CAT_ORDER[b.slug] ?? 99)),
    [categories],
  );

  const visible = useMemo(() => {
    return models.filter((m) => {
      if (prices.size) {
        const hit = [...prices].some((id) => {
          const b = bands.find((x) => x.id === id);
          if (!b) return false;
          return (m.price_min_m_ft ?? 0) <= b.max_m_ft && (m.price_max_m_ft ?? 0) >= b.min_m_ft;
        });
        if (!hit) return false;
      }
      if (cats.size   && !cats.has(m.category))    return false;
      if (drvSel.size && !drvSel.has(m.drive))     return false;
      if (brSel.size  && !brSel.has(m.brand_name)) return false;
      return true;
    });
  }, [models, prices, cats, drvSel, brSel, bands]);

  const paramDef = PARAMS.find((p) => p.id === param)!;
  // RenderCards = expanded entries on the chart. A model with multiple distinct
  // values for the active parameter (via engine variants) becomes multiple cards.
  const renderCards = useMemo(
    () => buildRenderCards(visible, paramDef),
    [visible, paramDef],
  );

  const detail = pinned || hovered;

  return (
    <div>
      {/* ── Top filter bar ─────────────────────────────────────────────────── */}
      <div className="cat-topfilter">
        <div className="container-wide">

          {/* Row: Ársáv */}
          <div className="cat-frow">
            <div className="cat-frow-head">
              <span className="cat-frow-label">Ársáv</span>
            </div>
            <div className="cat-frow-chips">
              <button type="button"
                className={`fltr-chip${prices.size === 0 ? " on" : ""}`}
                onClick={() => setPrices(new Set())}
              >Összes</button>
              {bands.map((b) => (
                <button key={b.id} type="button"
                  className={`fltr-chip${prices.has(b.id) ? " on" : ""}`}
                  onClick={() => setPrices(toggleSet(prices, b.id))}
                >{b.label_hu}</button>
              ))}
            </div>
          </div>

          {/* Row: Hajtás */}
          <div className="cat-frow">
            <div className="cat-frow-head">
              <span className="cat-frow-label">Hajtás</span>
            </div>
            <div className="cat-frow-chips">
              <button type="button"
                className={`fltr-chip${drvSel.size === 0 ? " on" : ""}`}
                onClick={() => setDrvSel(new Set())}
              >Összes</button>
              {drives.map((d) => (
                <button key={d.id} type="button"
                  className={`fltr-chip${drvSel.has(d.label_hu) ? " on" : ""}`}
                  onClick={() => setDrvSel(toggleSet(drvSel, d.label_hu))}
                >{d.label_hu}</button>
              ))}
            </div>
          </div>

          {/* Row: Kategória — icon chips */}
          <div className="cat-frow">
            <div className="cat-frow-head">
              <span className="cat-frow-label">Kategória</span>
            </div>
            <div className="cat-frow-chips cat-frow-chips--cat">
              <button type="button"
                className={`cat-chip cat-chip--all${cats.size === 0 ? " on" : ""}`}
                onClick={() => setCats(new Set())}
              >
                <span className="cat-chip-name">Összes</span>
              </button>
              {sortedCats.map((c) => {
                const short = CAT_SHORT[c.slug] ?? c.label_hu;
                const icon  = CAT_ICON[c.slug];
                const isOn  = cats.has(c.label_hu);
                return (
                  <button key={c.id} type="button"
                    className={`cat-chip${isOn ? " on" : ""}`}
                    onClick={() => setCats(toggleSet(cats, c.label_hu))}
                  >
                    {icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={icon} alt="" aria-hidden className="cat-chip-icon" />
                    ) : (
                      <span className="cat-chip-icon-placeholder" />
                    )}
                    <span className="cat-chip-name">{short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row: Márka */}
          <div className="cat-frow">
            <div className="cat-frow-head">
              <span className="cat-frow-label">Márka</span>
            </div>
            <div className="cat-frow-chips">
              <button type="button"
                className={`fltr-chip${brSel.size === 0 ? " on" : ""}`}
                onClick={() => setBrSel(new Set())}
              >Összes</button>
              {brands.map((b) => (
                <button key={b.id} type="button"
                  className={`fltr-chip${brSel.has(b.name) ? " on" : ""}`}
                  onClick={() => setBrSel(toggleSet(brSel, b.name))}
                >{b.name}</button>
              ))}
            </div>
          </div>

          {/* Param picker — separated below filters */}
          <div className="cat-param-bar">
            <div className="cat-param-bar-label">
              Megjelenítés alapja · <b>{paramDef.label}</b>
            </div>
            <div className="cat-param-grid">
              {PARAMS.map((p) => (
                <button key={p.id} type="button"
                  className={`cat-param${p.id === param ? " on" : ""}`}
                  onClick={() => setParam(p.id)}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Desktop: chart + detail ─────────────────────────────────────────── */}
      <div className="container-wide">
        <div className="cat-main">
          <div className="cat-center">
            <VBar
              visible={visible}
              renderCards={renderCards}
              param={paramDef}
              pinned={pinned}
              hovered={hovered}
              onHover={setHovered}
              onPin={(m) => setPinned((curr) => (curr && curr.id === m.id ? null : m))}
            />
          </div>
          <aside className="cat-right">
            {detail ? (
              <DetailCard model={detail} />
            ) : (
              <div className="cat-empty">
                Vigyél kurzort egy modell fölé, vagy kattints rá a részletekért.
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* ── Mobile: vertical diff-list ──────────────────────────────────────── */}
      <MobileBar renderCards={renderCards} param={paramDef} visible={visible} />
    </div>
  );
}

// ─── Difference label formatter ───────────────────────────────────────────────
function fmtDiff(diff: number, paramId: Param): string {
  if (diff <= 0) return "";
  switch (paramId) {
    case "priceMin":
      // ≥ 1M → "+1,4 M"   < 1M → "+400 E"
      if (diff >= 1) return `+${diff.toFixed(1).replace(".", ",")} M`;
      return `+${Math.round(diff * 1000)} E`;
    case "range":    return `+${Math.round(diff)} km`;
    case "length":   return `+${Math.round(diff)} mm`;
    case "trunk":    return `+${Math.round(diff)} l`;
    case "battery":
      return `+${(Math.round(diff * 10) / 10).toString().replace(".", ",")} kWh`;
    case "power":    return `+${Math.round(diff)} LE`;
    case "seats":    return `+${Math.round(diff)} fő`;
    default:         return `+${diff}`;
  }
}

// ─── Gap background gradient (warm amber, scales with diff magnitude) ─────────
function gapBg(normalized: number): string {
  // lightness 96% → 77%, chroma 0.02 → 0.19, hue 50 (warm amber)
  const l = (96 - normalized * 19).toFixed(1);
  const c = (0.02 + normalized * 0.17).toFixed(3);
  return `linear-gradient(to right, transparent, oklch(${l}% ${c} 50) 50%, transparent)`;
}

// ─── Tick step calculation ────────────────────────────────────────────────────
function computeTickStep(paramId: Param, span: number): number {
  const steps: Record<Param, number[]> = {
    priceMin: [0.5, 1, 2, 5, 10],
    range:    [50, 100, 200, 500, 1000],
    length:   [100, 250, 500, 1000],
    trunk:    [25, 50, 100, 200, 500],
    battery:  [5, 10, 20, 50],
    power:    [25, 50, 100, 200],
    seats:    [1, 2, 5],
  };
  const opts = steps[paramId] ?? [Math.max(1, Math.round(span / 8))];
  for (const s of opts) {
    if (Math.ceil(span / s) <= 15) return s;
  }
  return opts[opts.length - 1];
}

// ─── Desktop layout computation ───────────────────────────────────────────────
interface PlacedCar {
  m: ModelRow;
  v: number;
  variantName: string | null;
  key: string;
  axisY: number;
  cardX: number;
  cardY: number;
}

type CarItem = {
  m: ModelRow;
  v: number;
  variantName: string | null;
  key: string;
};

function computeLayout(
  cars: CarItem[],
  minV: number,
  maxV: number,
  paramId: Param,
  containerWidth: number,
  paramFmt: (v: number) => string,
): {
  placed: PlacedCar[];
  chartH: number;
  ticks: { v: number; y: number; label: string }[];
} {
  const span         = maxV - minV || 1;
  const tickStep     = computeTickStep(paramId, span);
  const numIntervals = Math.max(1, Math.ceil(span / tickStep));
  const maxCols      = Math.max(1, Math.floor((containerWidth - CARDS_X) / (CARD_W + H_GAP)));
  const sorted       = [...cars].sort((a, b) => a.v - b.v);

  // ① Pre-group in value-space → stable chartH
  const CLUSTER_VAL = Math.max(span * 0.015, 0.001);
  const preGroups: CarItem[][] = [];
  {
    let cur: CarItem[] = [];
    let curV = -Infinity;
    for (const item of sorted) {
      if (cur.length === 0 || item.v - curV <= CLUSTER_VAL) {
        if (cur.length === 0) curV = item.v;
        cur.push(item);
      } else {
        preGroups.push(cur);
        cur = [item];
        curV = item.v;
      }
    }
    if (cur.length > 0) preGroups.push(cur);
  }

  const totalRows = preGroups.reduce((s, g) => s + Math.ceil(g.length / maxCols), 0);
  const chartH = Math.max(
    totalRows * (CARD_H + V_GAP) + Math.max(0, preGroups.length - 1) * GRP_GAP + TOP_PAD + BOT_PAD,
    numIntervals * 64 + TOP_PAD + BOT_PAD,
    500,
  );

  // ② Y-mapping
  const effRange = chartH - TOP_PAD - BOT_PAD;
  function yOnAxis(v: number): number {
    return TOP_PAD + ((v - minV) / span) * effRange;
  }

  // ③ Pixel-space grouping
  const pxPerInterval = effRange / numIntervals;
  const CLUSTER_PX    = Math.min(CARD_H, pxPerInterval * 0.55);
  const groups: { cars: CarItem[]; axisY: number }[] = [];
  {
    let cur: CarItem[] = [];
    let curAY = -Infinity;
    for (const item of sorted) {
      const ay = yOnAxis(item.v);
      if (cur.length === 0 || ay - curAY <= CLUSTER_PX) {
        if (cur.length === 0) curAY = ay;
        cur.push(item);
      } else {
        groups.push({ cars: cur, axisY: curAY });
        cur = [item];
        curAY = ay;
      }
    }
    if (cur.length > 0) groups.push({ cars: cur, axisY: curAY });
  }

  // ④ Place groups
  const placed: PlacedCar[] = [];
  let prevBottom = TOP_PAD;
  for (const g of groups) {
    const numRows  = Math.ceil(g.cars.length / maxCols);
    const natTop   = Math.max(TOP_PAD, g.axisY - CARD_H / 2);
    const groupTop = Math.max(prevBottom, natTop);
    g.cars.forEach((item, i) => {
      placed.push({
        m: item.m,
        v: item.v,
        variantName: item.variantName,
        key: item.key,
        axisY: g.axisY,
        cardX: CARDS_X + (i % maxCols) * (CARD_W + H_GAP),
        cardY: groupTop + Math.floor(i / maxCols) * (CARD_H + V_GAP),
      });
    });
    prevBottom = groupTop + numRows * CARD_H + (numRows - 1) * V_GAP + GRP_GAP;
  }

  // ⑤ Ticks
  const firstTickN = Math.ceil((minV - 0.0001) / tickStep);
  const ticks: { v: number; y: number; label: string }[] = [];
  for (let i = 0; ; i++) {
    const t = +(firstTickN * tickStep + i * tickStep).toFixed(10);
    if (t > maxV + tickStep * 0.01) break;
    if (t < minV - tickStep * 0.01) continue;
    ticks.push({ v: t, y: yOnAxis(t), label: paramFmt(t) });
  }

  return { placed, chartH, ticks };
}

// ─── Desktop vertical bar ─────────────────────────────────────────────────────
function VBar({
  visible, renderCards, param, pinned, hovered, onHover, onPin,
}: {
  visible: ModelRow[];
  renderCards: RenderCard[];
  param: (typeof PARAMS)[number];
  pinned: ModelRow | null;
  hovered: ModelRow | null;
  onHover: (m: ModelRow | null) => void;
  onPin: (m: ModelRow) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(800);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setCw(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([e]) => setCw(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!renderCards.length) {
    return (
      <div className="cat-vbar-wrap">
        <div className="cat-vbar-head">
          <h2>Vizuális <em>{param.label.toLowerCase()}</em>-hasáb</h2>
          <div className="meta"><b>0</b> modell</div>
        </div>
        <div className="cat-empty" style={{ marginTop: 40, padding: 28, textAlign: "center" }}>
          Nincs adat ehhez a paraméterhez a szűrt modellekben.
        </div>
      </div>
    );
  }

  const vals = renderCards.map((rc) => rc.value);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);

  const layout = useMemo(
    () => computeLayout(
      renderCards.map((rc) => ({
        m: rc.model,
        v: rc.value,
        variantName: rc.variantName,
        key: rc.key,
      })),
      minV, maxV, param.id, cw, param.fmt,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderCards, param.id, param.fmt, minV, maxV, cw],
  );

  return (
    <div className="cat-vbar-wrap">
      <div className="cat-vbar-head">
        <div>
          <h2>Vizuális <em>{param.label.toLowerCase()}</em>-hasáb</h2>
        </div>
        <div className="meta">
          <b>{visible.length}</b> modell · {param.fmt(minV)} – {param.fmt(maxV)}
        </div>
      </div>

      <div ref={wrapRef} className="cat-chart" style={{ height: layout.chartH }}>
        <div className="cat-ax-line" style={{ height: layout.chartH }} />

        {layout.ticks.map((t) => (
          <div key={t.v} className="cat-ax-tick" style={{ top: t.y }}>
            <span className="cat-ax-tick-lbl">{t.label}</span>
            <span className="cat-ax-tick-notch" />
          </div>
        ))}

        <svg className="cat-connectors" style={{ height: layout.chartH }} xmlns="http://www.w3.org/2000/svg">
          {layout.placed.map((p) => {
            const isHi = hovered?.id === p.m.id || pinned?.id === p.m.id;
            return (
              <line key={p.key}
                x1={AXIS_X} y1={p.axisY}
                x2={p.cardX} y2={p.cardY + CARD_H / 2}
                className={`cat-cl${isHi ? " hi" : ""}`}
              />
            );
          })}
        </svg>

        {layout.placed.map((p) => {
          const photo = photoUrl(p.m.primary_photo_path);
          return (
            <div key={p.key}
              className={`cat-card${pinned?.id === p.m.id ? " pinned" : ""}`}
              style={{ left: p.cardX, top: p.cardY }}
              onMouseEnter={() => onHover(p.m)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onPin(p.m)}
            >
              <div className="cat-card-thumb">
                {photo ? <img src={photo} alt="" loading="lazy" /> : null}
              </div>
              <div className="cat-card-info">
                <span className="cat-card-name">
                  {p.m.brand_name} {p.m.name}
                  {p.variantName ? (
                    <span className="cat-card-variant"> · {p.variantName}</span>
                  ) : null}
                </span>
                <span className="cat-card-val">{param.fmt(p.v)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile card list with value-difference labels ────────────────────────────
function MobileBar({
  renderCards, param, visible,
}: {
  renderCards: RenderCard[];
  param: (typeof PARAMS)[number];
  visible: ModelRow[];
}) {
  if (!renderCards.length) {
    return (
      <div className="cat-mob-results">
        <div className="cat-empty" style={{ margin: "20px 16px" }}>
          Nincs megjeleníthető modell a jelenlegi szűrőkkel.
        </div>
      </div>
    );
  }

  // Sort RenderCards ascending by value (variants of the same model split
  // across the list at their own value).
  const sorted = [...renderCards].sort((a, b) => a.value - b.value);

  // Compute max diff for gradient normalization
  let maxDiff = 0.001;
  for (let i = 1; i < sorted.length; i++) {
    const d = sorted[i].value - sorted[i - 1].value;
    if (d > maxDiff) maxDiff = d;
  }

  const minV = sorted[0].value;
  const maxV = sorted[sorted.length - 1].value;

  return (
    <div className="cat-mob-results">
      <div className="cat-mob-head">
        <b>{visible.length}</b> modell &middot; {param.label}:{" "}
        {param.fmt(minV)} – {param.fmt(maxV)}
      </div>

      <div className="cat-mob-scroll-wrap">
        <div className="cat-mob-scroll">
          <div className="cat-mob-list">
            {sorted.map((rc, i) => {
              const m     = rc.model;
              const v     = rc.value;
              const photo = photoUrl(m.primary_photo_path);
              const next  = sorted[i + 1];
              const diff  = next ? next.value - v : 0;
              const norm  = diff / maxDiff; // 0–1

              return (
                <Fragment key={rc.key}>
                  {/* Card */}
                  <Link
                    href={`/modellek/${m.brand_slug}/${m.slug}`}
                    className="cat-mob-card"
                  >
                    <div className="cat-mob-thumb">
                      {photo ? <img src={photo} alt="" loading="eager" /> : null}
                    </div>
                    <div className="cat-mob-info">
                      <div className="cat-mob-name">
                        <span className="cat-mob-brand">{m.brand_name}</span>
                        {" "}{m.name}
                        {rc.variantName ? (
                          <span className="cat-mob-variant"> · {rc.variantName}</span>
                        ) : null}
                      </div>
                      <div className="cat-mob-val">{param.fmt(v)}</div>
                    </div>
                  </Link>

                  {/* Gap between this card and the next */}
                  {next && (
                    diff < 0.001 ? (
                      // Same value — tiny spacer, no label
                      <div className="cat-mob-samegap" />
                    ) : (
                      // Different value — labelled gap with warm amber gradient
                      <div
                        className="cat-mob-gap"
                        style={{ background: gapBg(norm) }}
                      >
                        <span className="cat-mob-gap-lbl">
                          {fmtDiff(diff, param.id)}
                        </span>
                      </div>
                    )
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
        {/* Gradient fade → "there's more below" visual hint */}
        <div className="cat-mob-fade" aria-hidden="true" />
      </div>
    </div>
  );
}

// ─── Desktop detail card ──────────────────────────────────────────────────────
function DetailCard({ model }: { model: ModelRow }) {
  const photo = photoUrl(model.primary_photo_path);
  const opts = model.engine_options ?? [];
  const hasOpts = opts.length > 0;
  return (
    <div className="cat-detail">
      <div className="ph">
        {photo ? <img src={photo} alt={model.name} /> : null}
      </div>
      <div className="body">
        <div className="b">{model.brand_name}</div>
        <h3>{model.name}</h3>
        <div className="meta">
          <span className="tag">{catLabel(model.category, model.segment)}</span>
          <span className="tag">{model.drive}</span>
          {model.is_deal ? (
            <span className="tag" style={{ background: "oklch(94% 0.06 50)", color: "oklch(38% 0.13 50)" }}>
              Akció
            </span>
          ) : null}
        </div>
        <div className="specs">
          <div className="spec">
            <div className="l">Alapár</div>
            <div className="v">{fmtPrice(model.price_min_m_ft)}</div>
          </div>
          <div className="spec">
            <div className="l">Csúcs</div>
            <div className="v">{fmtPrice(model.price_max_m_ft)}</div>
          </div>
          {!hasOpts && model.range_km ? (
            <div className="spec">
              <div className="l">Hatótáv</div>
              <div className="v">{model.range_km}<small> km</small></div>
            </div>
          ) : null}
          {!hasOpts && model.power_hp ? (
            <div className="spec">
              <div className="l">Teljesítmény</div>
              <div className="v">{model.power_hp}<small> LE</small></div>
            </div>
          ) : null}
          {!hasOpts && model.battery_kwh ? (
            <div className="spec">
              <div className="l">Akku</div>
              <div className="v">{model.battery_kwh.toString().replace(".", ",")}<small> kWh</small></div>
            </div>
          ) : null}
          {!hasOpts && model.trunk_l ? (
            <div className="spec">
              <div className="l">Csomagtartó</div>
              <div className="v">{model.trunk_l}<small> l</small></div>
            </div>
          ) : null}
        </div>
        {hasOpts ? (
          <CatalogVariantList options={opts} />
        ) : null}
        <div className="actions">
          <Link className="btn" href={`/markak/${model.brand_slug}`}>
            <Tag size={13} />
            Márka
          </Link>
          <Link className="btn" href={`/modellek/${model.brand_slug}/${model.slug}`}>
            Részletek
          </Link>
          <Link
            className="btn primary"
            href={`/osszehasonlitas?models=${encodeURIComponent(model.brand_name)}|${encodeURIComponent(model.name)}`}
          >
            <GitCompareArrows size={13} />
            Összevet
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Catalog variant list (shown in the right detail panel) ─────────────────
function CatalogVariantList({ options }: { options: ModelEngineOption[] }) {
  return (
    <div className="cat-detail-variants">
      <div className="cat-detail-variants-head">Modellváltozatok</div>
      <ul className="cat-detail-variants-list">
        {options.map((o) => {
          const parts: string[] = [];
          if (o.range_km    != null) parts.push(`${o.range_km} km`);
          if (o.battery_kwh != null) parts.push(`${o.battery_kwh.toString().replace(".", ",")} kWh`);
          if (o.power_hp    != null) parts.push(`${o.power_hp} LE`);
          if (o.trunk_l     != null) parts.push(`${o.trunk_l} l`);
          if (o.seats       != null) parts.push(`${o.seats} fő`);
          return (
            <li key={o.id}>
              <span className="cat-dv-name">{o.name || "Base"}</span>
              <span className="cat-dv-vals">{parts.join(" · ")}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
