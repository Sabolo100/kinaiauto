"use client";

import { useState, useEffect, useCallback } from "react";
import type { ModelPhoto } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KIND_ORDER = ["hero", "exterior", "interior", "dashboard", "rear", "trunk", "gallery"] as const;
const KIND_LABEL: Record<string, string> = {
  hero: "Külső fő nézet", exterior: "Külső", interior: "Belső",
  dashboard: "Műszerfal", rear: "Hátsó nézet", trunk: "Csomagtartó", gallery: "Galéria",
};
const PLACEHOLDER_LABELS = ["Külső fő nézet", "Belső", "Műszerfal", "Hátsó nézet", "Csomagtartó"];

function imgUrl(path: string) {
  if (!SUPABASE_URL || !path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/car-photos/${path}`;
}

function sortPhotos(photos: ModelPhoto[]): ModelPhoto[] {
  return [...photos].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    const ai = KIND_ORDER.indexOf(a.kind as typeof KIND_ORDER[number]);
    const bi = KIND_ORDER.indexOf(b.kind as typeof KIND_ORDER[number]);
    return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
  });
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({ photos, startIndex, onClose }: {
  photos: ModelPhoto[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const total = photos.length;
  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const current = photos[idx];
  const url = imgUrl(current.storage_path);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,.93)",
        display: "flex", flexDirection: "column",
      }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 20,
          background: "none", border: "none", color: "#fff",
          fontSize: 28, cursor: "pointer", zIndex: 1, lineHeight: 1,
        }}
      >×</button>

      {/* Counter */}
      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "14px 0 8px" }}>
        {idx + 1} / {total} · {KIND_LABEL[current.kind] ?? current.kind}
      </div>

      {/* Main image */}
      <div
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 56px", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={current.id}
            src={url}
            alt={KIND_LABEL[current.kind] ?? current.kind}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 6 }}
          />
        ) : (
          <div style={{ color: "#475569", fontSize: 14 }}>Kép nem elérhető</div>
        )}
      </div>

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,.1)", border: "none", color: "#fff",
              width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 20,
            }}
          >‹</button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,.1)", border: "none", color: "#fff",
              width: 40, height: 40, borderRadius: "50%", cursor: "pointer", fontSize: 20,
            }}
          >›</button>
        </>
      )}

      {/* Thumbnail strip */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex", gap: 6, padding: "10px 16px 16px",
          overflowX: "auto", justifyContent: total <= 6 ? "center" : "flex-start",
        }}
      >
        {photos.map((p, i) => {
          const tUrl = imgUrl(p.storage_path);
          return (
            <button
              key={p.id}
              onClick={() => setIdx(i)}
              style={{
                flexShrink: 0, width: 72, height: 48,
                border: i === idx ? "2px solid #60a5fa" : "2px solid transparent",
                borderRadius: 4, overflow: "hidden", padding: 0, cursor: "pointer",
                background: "#1e293b", opacity: i === idx ? 1 : 0.55,
                transition: "opacity .15s, border-color .15s",
              }}
            >
              {tUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "#334155" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Gallery (1 big + 4 small) ─────────────────────────────────────────

export function ModelGallery({ photos }: { photos: ModelPhoto[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const sorted = sortPhotos(photos);
  const hasPhotos = sorted.length > 0;

  const open = (i: number) => setLightboxIdx(i);
  const close = useCallback(() => setLightboxIdx(null), []);

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox photos={sorted} startIndex={lightboxIdx} onClose={close} />
      )}

      {hasPhotos ? (
        <div className="gallery-real">
          {/* Big photo — left */}
          <button
            className="gallery-big"
            onClick={() => open(0)}
            aria-label="Galéria megnyitása"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgUrl(sorted[0].storage_path) ?? ""} alt={KIND_LABEL[sorted[0].kind] ?? sorted[0].kind} />
            <span className="gallery-tag">{KIND_LABEL[sorted[0].kind] ?? sorted[0].kind}</span>
          </button>

          {/* Small photos — right 2×2 */}
          <div className="gallery-grid-small">
            {[1, 2, 3, 4].map((slot) => {
              const p = sorted[slot];
              if (p) {
                const url = imgUrl(p.storage_path);
                return (
                  <button key={p.id} className="gallery-small" onClick={() => open(slot)} aria-label="Galéria megnyitása">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt={KIND_LABEL[p.kind] ?? p.kind} />
                    ) : null}
                    <span className="gallery-tag">{KIND_LABEL[p.kind] ?? p.kind}</span>
                    {slot === 4 && sorted.length > 5 && (
                      <span className="gallery-more">+{sorted.length - 5} fotó</span>
                    )}
                  </button>
                );
              }
              return (
                <div key={slot} className="gallery-small placeholder">
                  <span className="tag">{PLACEHOLDER_LABELS[slot]}</span>
                </div>
              );
            })}
          </div>

          {/* Full gallery button */}
          {sorted.length > 1 && (
            <button className="gallery-all-btn" onClick={() => open(0)}>
              Teljes galéria ({sorted.length} fotó)
            </button>
          )}
        </div>
      ) : (
        /* No photos — original placeholder */
        <div className="gallery">
          {PLACEHOLDER_LABELS.map((tag, i) => (
            <div key={i} className="slot placeholder">
              <span className="tag">{tag}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
