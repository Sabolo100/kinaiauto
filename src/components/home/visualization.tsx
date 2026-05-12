"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ModelRow } from "@/lib/types";
import { fmtUnit, brandInitials } from "@/lib/format";
import { photoUrl } from "@/lib/data";

type Key =
  | "priceMin"
  | "length"
  | "trunk"
  | "range"
  | "power"
  | "seats";

const SEG: { key: Key; label: string; col: keyof ModelRow }[] = [
  { key: "priceMin", label: "Ár", col: "price_min_m_ft" },
  { key: "length", label: "Hossz", col: "length_mm" },
  { key: "trunk", label: "Csomagtartó", col: "trunk_l" },
  { key: "range", label: "Hatótáv", col: "range_km" },
  { key: "power", label: "Teljesítmény", col: "power_hp" },
  { key: "seats", label: "Ülések", col: "seats" },
];

const SCATTER = [
  { x: -12, y: -44 },
  { x: 14, y: -40 },
  { x: 0, y: -58 },
  { x: -22, y: -30 },
  { x: 22, y: -30 },
  { x: -8, y: -22 },
  { x: 10, y: -22 },
  { x: -26, y: -50 },
  { x: 26, y: -50 },
];

export function Visualization({ models }: { models: ModelRow[] }) {
  const [vizKey, setVizKey] = useState<Key>("priceMin");
  const [zoom, setZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const seg = SEG.find((s) => s.key === vizKey)!;
  const valid = useMemo(
    () => models.filter((m) => (m[seg.col] as number | null) != null && (m[seg.col] as number) > 0),
    [models, seg],
  );

  const { min, max, ticks } = useMemo(() => {
    if (!valid.length) return { min: 0, max: 0, ticks: [] as number[] };
    const vals = valid.map((m) => m[seg.col] as number);
    let mn = Math.min(...vals);
    let mx = Math.max(...vals);
    const padding = (mx - mn) * 0.04 || mx * 0.04;
    mn = Math.max(0, mn - padding);
    mx = mx + padding;
    return { min: mn, max: mx, ticks: niceTicks(mn, mx, 8).ticks };
  }, [valid, seg]);

  function niceTicks(min: number, max: number, target = 8) {
    const span = max - min;
    const raw = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = mag * (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10);
    const start = Math.ceil(min / step) * step;
    const out: number[] = [];
    for (let v = start; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
    return { step, ticks: out };
  }

  const span = max - min || 1;

  function setZoomAt(z: number, anchorX?: number) {
    const scroll = scrollRef.current;
    const stage = stageRef.current;
    if (!scroll || !stage) {
      setZoom(Math.max(1, Math.min(8, z)));
      return;
    }
    const oldW = stage.offsetWidth;
    const rect = scroll.getBoundingClientRect();
    const localX =
      anchorX != null ? anchorX - rect.left : scroll.clientWidth / 2;
    const oldScroll = scroll.scrollLeft;
    const ratio = (oldScroll + localX) / oldW;
    const next = Math.max(1, Math.min(8, z));
    setZoom(next);
    requestAnimationFrame(() => {
      const newW = stage.offsetWidth;
      scroll.scrollLeft = ratio * newW - localX;
    });
  }

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const f = e.deltaY < 0 ? 1.2 : 1 / 1.2;
      setZoomAt(zoom * f, e.clientX);
    }
    const scroll = scrollRef.current;
    scroll?.addEventListener("wheel", onWheel, { passive: false });
    return () => scroll?.removeEventListener("wheel", onWheel);
  }, [zoom]);

  return (
    <div className="viz-wrap">
      <div className="viz-controls">
        <div className="left">
          <span className="lbl">Megjelenítés</span>
          <div className="seg">
            {SEG.map((s) => (
              <button
                key={s.key}
                type="button"
                className={s.key === vizKey ? "on" : ""}
                onClick={() => setVizKey(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            className="mono"
            style={{ fontSize: 11.5, color: "var(--ink-mute)" }}
          >
            {valid.length} modell · {seg.label}
          </div>
          <div className="viz-zoombar">
            <button
              type="button"
              data-z="out"
              title="Kicsinyítés"
              onClick={() => setZoomAt(zoom / 1.6)}
            >
              −
            </button>
            <span className="z">
              {zoom.toFixed(1).replace(/\.0$/, "")}×
            </span>
            <button
              type="button"
              data-z="in"
              title="Nagyítás"
              onClick={() => setZoomAt(zoom * 1.6)}
            >
              +
            </button>
            <button
              type="button"
              data-z="reset"
              style={{ width: "auto", padding: "0 10px", fontSize: 11 }}
              onClick={() => setZoomAt(1)}
            >
              reset
            </button>
          </div>
        </div>
      </div>
      <div ref={scrollRef} className="viz-scroll">
        <div
          ref={stageRef}
          className="viz-stage"
          style={{ width: `${100 * zoom}%` }}
          onDoubleClick={(e) => setZoomAt(zoom * 1.6, e.clientX)}
        >
          <div className="viz-line" />
          <div>
            {ticks.map((v, i) => {
              const p = ((v - min) / span) * 100;
              return (
                <div key={`tick-${i}`}>
                  <div
                    className={`viz-tick ${i % 2 === 0 ? "major" : ""}`}
                    style={{ left: `${p}%` }}
                  />
                  <div className="viz-tick-lbl" style={{ left: `${p}%` }}>
                    {fmtUnit(v, vizKey)}
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            {valid
              .slice()
              .sort(
                (a, b) =>
                  ((a[seg.col] as number) || 0) -
                  ((b[seg.col] as number) || 0),
              )
              .map((m, idx) => {
                const v = m[seg.col] as number;
                const pct = ((v - min) / span) * 100;
                const o = SCATTER[idx % SCATTER.length];
                const tone = m.brand_tone ?? "#374151";
                const photo = photoUrl(m.primary_photo_path);
                const top = 64 - 14 + o.y;
                return (
                  <div
                    key={m.id}
                    className="viz-thumb"
                    style={{
                      left: `calc(${pct}% - 21px)`,
                      top: `${top}px`,
                      transform: `translateX(${o.x}px)`,
                      ["--tx" as string]: `${o.x}px`,
                      ["--ty" as string]: `0px`,
                    }}
                  >
                    <div className="viz-thumb-img">
                      {photo ? (
                        <img src={photo} alt={`${m.brand_name} ${m.name}`} />
                      ) : (
                        <div className="ph" style={{ background: tone }}>
                          {brandInitials(m.brand_name)}
                        </div>
                      )}
                    </div>
                    <div className="viz-thumb-name">
                      <b>{m.brand_name}</b>
                      {m.name}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
