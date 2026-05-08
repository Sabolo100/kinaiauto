"use client";

import { useMemo, useState } from "react";
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
import { fmtPrice } from "@/lib/format";
import { photoUrl } from "@/lib/data";
import "./catalog.css";

type Param =
  | "priceMin"
  | "range"
  | "length"
  | "trunk"
  | "battery"
  | "power"
  | "seats";

const PARAMS: {
  id: Param;
  label: string;
  col: keyof ModelRow;
  icon: React.ReactNode;
  fmt: (v: number) => string;
}[] = [
  { id: "priceMin", label: "Ár",            col: "price_min_m_ft", icon: <Banknote size={13} />,        fmt: (v) => v.toFixed(1).replace(".", ",") + " M Ft" },
  { id: "range",    label: "Hatótáv",       col: "range_km",       icon: <Route size={13} />,           fmt: (v) => `${Math.round(v)} km` },
  { id: "length",   label: "Hossz",         col: "length_mm",      icon: <Ruler size={13} />,           fmt: (v) => `${Math.round(v)} mm` },
  { id: "trunk",    label: "Csomagtartó",   col: "trunk_l",        icon: <Package size={13} />,         fmt: (v) => `${Math.round(v)} l` },
  { id: "battery",  label: "Akku",          col: "battery_kwh",    icon: <BatteryCharging size={13} />, fmt: (v) => (Math.round(v * 10) / 10).toString().replace(".", ",") + " kWh" },
  { id: "power",    label: "Teljesítmény",  col: "power_hp",       icon: <Zap size={13} />,             fmt: (v) => `${Math.round(v)} LE` },
  { id: "seats",    label: "Ülőhelyek",     col: "seats",          icon: <Users size={13} />,           fmt: (v) => `${Math.round(v)} fő` },
];

type Props = {
  models: ModelRow[];
  brands: Brand[];
  categories: Category[];
  drives: Drive[];
  bands: PriceBand[];
};

export function CatalogApp({ models, brands, categories, drives, bands }: Props) {
  const [prices, setPrices] = useState<Set<string>>(new Set());
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [drvSel, setDrvSel] = useState<Set<string>>(new Set());
  const [brSel, setBrSel] = useState<Set<string>>(new Set());
  const [dealOnly, setDealOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [param, setParam] = useState<Param>("priceMin");
  const [side, setSide] = useState<"auto" | "left" | "right">("auto");
  const [pinned, setPinned] = useState<ModelRow | null>(null);
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
          return (
            (m.price_min_m_ft ?? 0) <= b.max_m_ft &&
            (m.price_max_m_ft ?? 0) >= b.min_m_ft
          );
        });
        if (!hit) return false;
      }
      if (cats.size && !cats.has(m.category)) return false;
      if (drvSel.size && !drvSel.has(m.drive)) return false;
      if (brSel.size && !brSel.has(m.brand_name)) return false;
      if (dealOnly && !m.is_deal) return false;
      if (availableOnly && !m.is_available) return false;
      return true;
    });
  }, [models, prices, cats, drvSel, brSel, dealOnly, availableOnly, bands]);

  const paramDef = PARAMS.find((p) => p.id === param)!;
  const withVal = useMemo(
    () =>
      visible.filter((m) => {
        const v = m[paramDef.col] as number | null;
        return v != null;
      }),
    [visible, paramDef],
  );

  const detail = pinned || hovered;

  return (
    <div className="container-wide">
      <div className="cat-workbench">
        {/* LEFT FILTERS */}
        <aside className="cat-sidebar">
          <h3 className="serif" style={{ fontSize: 24, margin: "0 0 4px" }}>
            Szűrők
          </h3>
          <div className="cat-desc">
            A bal oldali választások szűrik a hasábon megjelenő modelleket.
          </div>

          <FilterGroup
            label="Ársáv"
            active={prices.size > 0}
            onClear={() => setPrices(new Set())}
          >
            <div className="chip-grid">
              {bands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`cat-chip ${prices.has(b.id) ? "on" : ""}`}
                  onClick={() => setPrices(toggleSet(prices, b.id))}
                >
                  {b.label_hu}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup
            label="Kategória"
            active={cats.size > 0}
            onClear={() => setCats(new Set())}
          >
            <div className="chip-grid">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cat-chip ${cats.has(c.label_hu) ? "on" : ""}`}
                  onClick={() => setCats(toggleSet(cats, c.label_hu))}
                >
                  {c.label_hu}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup
            label="Hajtás"
            active={drvSel.size > 0}
            onClear={() => setDrvSel(new Set())}
          >
            <div className="chip-grid">
              {drives.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`cat-chip ${drvSel.has(d.label_hu) ? "on" : ""}`}
                  onClick={() => setDrvSel(toggleSet(drvSel, d.label_hu))}
                >
                  {d.label_hu}
                </button>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup
            label="Márka"
            active={brSel.size > 0}
            onClear={() => setBrSel(new Set())}
          >
            <div className="chip-grid">
              {brands.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`cat-chip ${brSel.has(b.name) ? "on" : ""}`}
                  onClick={() => setBrSel(toggleSet(brSel, b.name))}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </FilterGroup>

          <div className="cat-filter-group">
            <h4>Csak…</h4>
            <button
              type="button"
              className={`cat-toggle ${dealOnly ? "on" : ""}`}
              onClick={() => setDealOnly((v) => !v)}
            >
              <span>Akciós modellek</span>
              <span className="sw" />
            </button>
            <button
              type="button"
              className={`cat-toggle ${availableOnly ? "on" : ""}`}
              onClick={() => setAvailableOnly((v) => !v)}
            >
              <span>Elérhető modellek</span>
              <span className="sw" />
            </button>
          </div>
        </aside>

        {/* CENTER */}
        <div className="cat-center">
          <div className="cat-picker">
            <div className="cat-pl">
              Megjelenítés alapja: <b>{paramDef.label}</b>
            </div>
            <div className="cat-param-grid">
              {PARAMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`cat-param ${p.id === param ? "on" : ""}`}
                  onClick={() => setParam(p.id)}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <VBar
            visible={visible}
            withVal={withVal}
            param={paramDef}
            side={side}
            onSide={setSide}
            pinned={pinned}
            onHover={setHovered}
            onPin={(m) =>
              setPinned((curr) =>
                curr && curr.id === m.id ? null : m,
              )
            }
          />
        </div>

        {/* RIGHT DETAIL */}
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
  );
}

function FilterGroup({
  label,
  active,
  onClear,
  children,
}: {
  label: string;
  active: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`cat-filter-group ${active ? "active" : ""}`}>
      <h4>
        {label}
        {active ? (
          <button type="button" className="reset" onClick={onClear}>
            törlés
          </button>
        ) : null}
      </h4>
      {children}
    </div>
  );
}

function VBar({
  visible,
  withVal,
  param,
  side,
  onSide,
  pinned,
  onHover,
  onPin,
}: {
  visible: ModelRow[];
  withVal: ModelRow[];
  param: { id: Param; label: string; col: keyof ModelRow; fmt: (v: number) => string };
  side: "auto" | "left" | "right";
  onSide: (s: "auto" | "left" | "right") => void;
  pinned: ModelRow | null;
  onHover: (m: ModelRow | null) => void;
  onPin: (m: ModelRow) => void;
}) {
  const placed = useMemo(() => {
    if (!withVal.length) return [];
    const vals = withVal.map((m) => m[param.col] as number);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const span = maxV - minV || 1;
    const sorted = [...withVal].sort(
      (a, b) =>
        ((b[param.col] as number) - (a[param.col] as number)),
    );
    return sorted.map((m) => {
      const v = m[param.col] as number;
      return { m, v, topPct: ((maxV - v) / span) * 100 };
    });
  }, [withVal, param]);

  const barHeight = Math.max(640, withVal.length * 56);
  const minGapPct = (40 / barHeight) * 100;

  const finalPlaced = useMemo(() => {
    const arr = placed.map((p) => ({ ...p, side: "right" as "left" | "right" }));
    if (side === "right") return arr;
    if (side === "left") return arr.map((p) => ({ ...p, side: "left" as const }));
    let lastR = -Infinity;
    let lastL = -Infinity;
    return arr.map((p) => {
      const okR = p.topPct - lastR >= minGapPct;
      const okL = p.topPct - lastL >= minGapPct;
      let chosen: "left" | "right" = "right";
      let nextTop = p.topPct;
      if (okR && okL) {
        if (lastR <= lastL) {
          chosen = "right";
          lastR = p.topPct;
        } else {
          chosen = "left";
          lastL = p.topPct;
        }
      } else if (okR) {
        chosen = "right";
        lastR = p.topPct;
      } else if (okL) {
        chosen = "left";
        lastL = p.topPct;
      } else {
        if (lastR <= lastL) {
          chosen = "right";
          nextTop = lastR + minGapPct;
          lastR = nextTop;
        } else {
          chosen = "left";
          nextTop = lastL + minGapPct;
          lastL = nextTop;
        }
      }
      return { ...p, side: chosen, topPct: nextTop };
    });
  }, [placed, side, minGapPct]);

  if (!withVal.length) {
    return (
      <div className="cat-vbar-wrap">
        <div className="cat-vbar-head">
          <h2>
            Vizuális <em>{param.label.toLowerCase()}</em>-hasáb
          </h2>
          <div className="meta">
            <b>0</b> modell
          </div>
        </div>
        <div
          className="cat-empty"
          style={{ marginTop: 60, padding: 28, textAlign: "center" }}
        >
          Nincs adat ehhez a paraméterhez.
        </div>
      </div>
    );
  }

  const vals = withVal.map((m) => m[param.col] as number);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const span = maxV - minV;

  function cleanTick(v: number): number {
    if (param.id === "battery" || param.id === "priceMin")
      return Math.round(v * 10) / 10;
    return Math.round(v);
  }

  return (
    <div className="cat-vbar-wrap">
      <div className="cat-vbar-head">
        <div>
          <h2>
            Vizuális <em>{param.label.toLowerCase()}</em>-hasáb
          </h2>
        </div>
        <div className="meta">
          <b>{visible.length}</b> modell · min–max{" "}
          {param.fmt(minV)} – {param.fmt(maxV)}
        </div>
      </div>
      <div className="cat-vbar-controls">
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            letterSpacing: ".04em",
            marginRight: 6,
          }}
        >
          CÍMKE OLDAL
        </span>
        <div className="seg">
          <button
            type="button"
            className={side === "auto" ? "on" : ""}
            onClick={() => onSide("auto")}
          >
            Auto
          </button>
          <button
            type="button"
            className={side === "right" ? "on" : ""}
            onClick={() => onSide("right")}
          >
            Mind jobbra
          </button>
          <button
            type="button"
            className={side === "left" ? "on" : ""}
            onClick={() => onSide("left")}
          >
            Mind balra
          </button>
        </div>
      </div>

      <div
        className="cat-vbar"
        style={{ minHeight: barHeight, height: barHeight }}
      >
        <div className="cat-vbar-axis" style={{ minHeight: barHeight }}>
          <div className="cat-vbar-cap top">MAX · {param.fmt(maxV)}</div>
          <div className="cat-vbar-cap bot">MIN · {param.fmt(minV)}</div>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const v = cleanTick(maxV - (span * i) / 5);
            return (
              <div
                key={i}
                className="cat-vbar-tick"
                style={{ top: `${(i / 5) * 100}%` }}
              >
                {param.fmt(v)}
              </div>
            );
          })}
          {finalPlaced.map((p) => {
            const photo = photoUrl(p.m.primary_photo_path);
            return (
              <div
                key={p.m.id}
                className={`cat-vchip ${p.side === "left" ? "left" : ""} ${
                  pinned?.id === p.m.id ? "pinned" : ""
                }`}
                style={{ top: `${p.topPct}%` }}
                onMouseEnter={() => onHover(p.m)}
                onMouseLeave={() => onHover(null)}
                onClick={() => onPin(p.m)}
              >
                <div className="tether" />
                <div className="thumb">
                  {photo ? (
                    <img src={photo} alt={`${p.m.brand_name} ${p.m.name}`} />
                  ) : null}
                </div>
                <div className="info">
                  <span className="b">{p.m.brand_name}</span>
                  <span className="n">{p.m.name}</span>
                  <span className="v">{param.fmt(p.v)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
          <span className="tag">{model.category}</span>
          <span className="tag">{model.drive}</span>
          {model.is_deal ? (
            <span
              className="tag"
              style={{
                background: "oklch(94% 0.06 50)",
                color: "oklch(38% 0.13 50)",
              }}
            >
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
              <div className="v">
                {model.range_km}
                <small> km</small>
              </div>
            </div>
          ) : null}
          {model.power_hp ? (
            <div className="spec">
              <div className="l">Teljesítmény</div>
              <div className="v">
                {model.power_hp}
                <small> LE</small>
              </div>
            </div>
          ) : null}
          {model.battery_kwh ? (
            <div className="spec">
              <div className="l">Akku</div>
              <div className="v">
                {model.battery_kwh.toString().replace(".", ",")}
                <small> kWh</small>
              </div>
            </div>
          ) : null}
          {model.trunk_l ? (
            <div className="spec">
              <div className="l">Csomagtartó</div>
              <div className="v">
                {model.trunk_l}
                <small> l</small>
              </div>
            </div>
          ) : null}
        </div>
        <div className="actions">
          <Link className="btn" href={`/markak/${model.brand_slug}`}>
            <Tag size={13} />
            Márka
          </Link>
          <Link
            className="btn"
            href={`/modellek/${model.brand_slug}/${model.slug}`}
          >
            Részletek
          </Link>
          <Link
            className="btn primary"
            href={`/osszehasonlitas?models=${encodeURIComponent(
              model.brand_name,
            )}|${encodeURIComponent(model.name)}`}
          >
            <GitCompareArrows size={13} />
            Összevet
          </Link>
        </div>
      </div>
    </div>
  );
}
