"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ModelRow,
  PriceBand,
} from "@/lib/types";
import { fmtPrice, catLabel, CATEGORY_SEGMENT } from "@/lib/format";
import { photoUrl } from "@/lib/data";
import "./catalog.css";

// ─── Chart layout constants ───────────────────────────────────────────────────
const AXIS_X  = 90;   // px from left edge of chart container → axis line
const CARD_H  = 60;   // card height px
const CARD_W  = 200;  // card width px
const H_GAP   = 10;   // horizontal gap between cards in same row
const V_GAP   = 14;   // vertical gap between rows inside a group
const GRP_GAP = 22;   // vertical gap between different value groups
const CARDS_X = 128;  // px from left edge → first card column starts
const TOP_PAD = 24;   // padding above first tick
const BOT_PAD = 64;   // padding below last card
// ─────────────────────────────────────────────────────────────────────────────

type Param = "priceMin" | "range" | "length" | "trunk" | "battery" | "power" | "seats";

const PARAMS: {
  id: Param;
  label: string;
  col: keyof ModelRow;
  icon: React.ReactNode;
  fmt: (v: number) => string;
}[] = [
  { id: "priceMin", label: "Ár",           col: "price_min_m_ft", icon: <Banknote size={13} />,        fmt: (v) => v.toFixed(1).replace(".", ",") + " M Ft" },
  { id: "range",    label: "Hatótáv",      col: "range_km",       icon: <Route size={13} />,           fmt: (v) => `${Math.round(v)} km` },
  { id: "length",   label: "Hossz",        col: "length_mm",      icon: <Ruler size={13} />,           fmt: (v) => `${Math.round(v)} mm` },
  { id: "trunk",    label: "Csomagtartó",  col: "trunk_l",        icon: <Package size={13} />,         fmt: (v) => `${Math.round(v)} l` },
  { id: "battery",  label: "Akku",         col: "battery_kwh",    icon: <BatteryCharging size={13} />, fmt: (v) => (Math.round(v * 10) / 10).toString().replace(".", ",") + " kWh" },
  { id: "power",    label: "Teljesítmény", col: "power_hp",       icon: <Zap size={13} />,             fmt: (v) => `${Math.round(v)} LE` },
  { id: "seats",    label: "Ülőhelyek",    col: "seats",          icon: <Users size={13} />,           fmt: (v) => `${Math.round(v)} fő` },
];

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

  function toggleSet(s: Set<string>, v: string): Set<string> {
    const n = new Set(s);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  }

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
  const withVal  = useMemo(
    () => visible.filter((m) => (m[paramDef.col] as number | null) != null),
    [visible, paramDef],
  );

  const detail = pinned || hovered;

  return (
    <div>
      {/* ── Top filter bar ─────────────────────────────────────────────────── */}
      <div className="cat-topfilter">
        <div className="container-wide">

          {/* Param picker */}
          <div className="cat-topfilter-param">
            <span className="cat-topfilter-label">Megjelenítés alapja</span>
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

          {/* Filter chips */}
          <div className="cat-topfilter-filters">
            <TopFilterGroup label="Ársáv" active={prices.size > 0} onClear={() => setPrices(new Set())}>
              {bands.map((b) => (
                <button key={b.id} type="button"
                  className={`cat-chip${prices.has(b.id) ? " on" : ""}`}
                  onClick={() => setPrices(toggleSet(prices, b.id))}
                >
                  {b.label_hu}
                </button>
              ))}
            </TopFilterGroup>

            <TopFilterGroup label="Kategória" active={cats.size > 0} onClear={() => setCats(new Set())}>
              {categories.map((c) => (
                <button key={c.id} type="button"
                  className={`cat-chip${cats.has(c.label_hu) ? " on" : ""}`}
                  onClick={() => setCats(toggleSet(cats, c.label_hu))}
                >
                  {c.label_hu}{CATEGORY_SEGMENT[c.slug] ? ` (${CATEGORY_SEGMENT[c.slug]})` : ""}
                </button>
              ))}
            </TopFilterGroup>

            <TopFilterGroup label="Hajtás" active={drvSel.size > 0} onClear={() => setDrvSel(new Set())}>
              {drives.map((d) => (
                <button key={d.id} type="button"
                  className={`cat-chip${drvSel.has(d.label_hu) ? " on" : ""}`}
                  onClick={() => setDrvSel(toggleSet(drvSel, d.label_hu))}
                >
                  {d.label_hu}
                </button>
              ))}
            </TopFilterGroup>

            <TopFilterGroup label="Márka" active={brSel.size > 0} onClear={() => setBrSel(new Set())}>
              {brands.map((b) => (
                <button key={b.id} type="button"
                  className={`cat-chip${brSel.has(b.name) ? " on" : ""}`}
                  onClick={() => setBrSel(toggleSet(brSel, b.name))}
                >
                  {b.name}
                </button>
              ))}
            </TopFilterGroup>
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="container-wide">
        <div className="cat-main">
          <div className="cat-center">
            <VBar
              visible={visible}
              withVal={withVal}
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
    </div>
  );
}

// ─── Top filter group ─────────────────────────────────────────────────────────
function TopFilterGroup({
  label, active, onClear, children,
}: {
  label: string;
  active: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="cat-topfilter-group">
      <span className="cat-topfilter-label">
        {label}
        {active ? (
          <button type="button" className="cat-topfilter-clear" onClick={onClear}>×</button>
        ) : null}
      </span>
      <div className="cat-topfilter-chips">
        {children}
      </div>
    </div>
  );
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

// ─── Layout computation ───────────────────────────────────────────────────────
interface PlacedCar {
  m: ModelRow;
  v: number;
  axisY: number; // Y on the axis (connector start)
  cardX: number;
  cardY: number;
}

type CarItem = { m: ModelRow; v: number };

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

  const sorted = [...cars].sort((a, b) => a.v - b.v);

  // ① Pre-group in value-space to know total rows → set a stable chartH
  //   This breaks the circular dependency (chartH ↔ yOnAxis ↔ pixel groups).
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

  // ② Y-mapping: axis runs TOP_PAD → chartH - BOT_PAD
  const effRange = chartH - TOP_PAD - BOT_PAD;
  function yOnAxis(v: number): number {
    return TOP_PAD + ((v - minV) / span) * effRange;
  }

  // ③ Pixel-space grouping for actual card placement
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

  // ④ Place groups: horizontal-first, wrap to next row, push down to avoid overlap
  const placed: PlacedCar[] = [];
  let prevBottom = TOP_PAD;

  for (const g of groups) {
    const numRows  = Math.ceil(g.cars.length / maxCols);
    const natTop   = Math.max(TOP_PAD, g.axisY - CARD_H / 2);
    const groupTop = Math.max(prevBottom, natTop);

    g.cars.forEach((item, i) => {
      placed.push({
        m:     item.m,
        v:     item.v,
        axisY: g.axisY,
        cardX: CARDS_X + (i % maxCols) * (CARD_W + H_GAP),
        cardY: groupTop + Math.floor(i / maxCols) * (CARD_H + V_GAP),
      });
    });

    prevBottom = groupTop + numRows * CARD_H + (numRows - 1) * V_GAP + GRP_GAP;
  }

  // ⑤ Ticks (index-based to avoid float drift)
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

// ─── Vertical bar (chart) ─────────────────────────────────────────────────────
function VBar({
  visible,
  withVal,
  param,
  pinned,
  hovered,
  onHover,
  onPin,
}: {
  visible: ModelRow[];
  withVal: ModelRow[];
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

  if (!withVal.length) {
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

  const vals = withVal.map((m) => m[param.col] as number);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);

  const layout = useMemo(
    () => computeLayout(
      withVal.map((m) => ({ m, v: m[param.col] as number })),
      minV, maxV, param.id, cw, param.fmt,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [withVal, param.id, param.col, param.fmt, minV, maxV, cw],
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

      {/* Chart area */}
      <div ref={wrapRef} className="cat-chart" style={{ height: layout.chartH }}>

        {/* Axis line — spans full chart height */}
        <div className="cat-ax-line" style={{ height: layout.chartH }} />

        {/* Tick marks */}
        {layout.ticks.map((t) => (
          <div key={t.v} className="cat-ax-tick" style={{ top: t.y }}>
            <span className="cat-ax-tick-lbl">{t.label}</span>
            <span className="cat-ax-tick-notch" />
          </div>
        ))}

        {/* SVG: straight diagonal connectors — rendered BEHIND cards */}
        <svg
          className="cat-connectors"
          style={{ height: layout.chartH }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {layout.placed.map((p) => {
            const isHi = hovered?.id === p.m.id || pinned?.id === p.m.id;
            return (
              <line
                key={p.m.id}
                x1={AXIS_X}
                y1={p.axisY}
                x2={p.cardX}
                y2={p.cardY + CARD_H / 2}
                className={`cat-cl${isHi ? " hi" : ""}`}
              />
            );
          })}
        </svg>

        {/* Car cards — z-index 2, above SVG */}
        {layout.placed.map((p) => {
          const photo = photoUrl(p.m.primary_photo_path);
          return (
            <div
              key={p.m.id}
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
                <span className="cat-card-name">{p.m.brand_name} {p.m.name}</span>
                <span className="cat-card-val">{param.fmt(p.v)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail card ──────────────────────────────────────────────────────────────
function DetailCard({ model }: { model: ModelRow }) {
  const photo = photoUrl(model.primary_photo_path);
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
          {model.range_km ? (
            <div className="spec">
              <div className="l">Hatótáv</div>
              <div className="v">{model.range_km}<small> km</small></div>
            </div>
          ) : null}
          {model.power_hp ? (
            <div className="spec">
              <div className="l">Teljesítmény</div>
              <div className="v">{model.power_hp}<small> LE</small></div>
            </div>
          ) : null}
          {model.battery_kwh ? (
            <div className="spec">
              <div className="l">Akku</div>
              <div className="v">{model.battery_kwh.toString().replace(".", ",")}<small> kWh</small></div>
            </div>
          ) : null}
          {model.trunk_l ? (
            <div className="spec">
              <div className="l">Csomagtartó</div>
              <div className="v">{model.trunk_l}<small> l</small></div>
            </div>
          ) : null}
        </div>
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
