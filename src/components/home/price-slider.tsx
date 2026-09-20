"use client";

import { useEffect, useRef, useState } from "react";
import { fmtMFt } from "@/lib/format";

// ── PriceSlider (unchanged) ───────────────────────────────────────────────────
export function PriceSlider({
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
