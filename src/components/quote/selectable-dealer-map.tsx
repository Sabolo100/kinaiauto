"use client";

import { useEffect, useRef } from "react";
import type { Dealer } from "@/lib/types";

type Props = {
  dealers: Dealer[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  atMax: boolean;
};

/**
 * Map that mirrors brands/dealer-map.tsx but uses coloured DivIcon markers
 * that toggle selection on click. Selected = green, unselected = grey.
 * Clicking an unselected marker while `atMax` is true is silently ignored
 * (parent enforces the cap).
 */
export function SelectableDealerMap({
  dealers,
  selectedIds,
  onToggle,
  atMax,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

  const withCoords = dealers.filter((d) => d.lat != null && d.lng != null);

  // ── Initialise map ──
  useEffect(() => {
    if (!containerRef.current || withCoords.length === 0) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const avgLat = withCoords.reduce((s, d) => s + d.lat!, 0) / withCoords.length;
      const avgLng = withCoords.reduce((s, d) => s + d.lng!, 0) / withCoords.length;
      const zoom = withCoords.length === 1 ? 13 : 7;

      map = L.map(containerRef.current).setView([avgLat, avgLng], zoom);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current.clear();

      for (const d of withCoords) {
        const icon = makeIcon(L, false);
        const marker = L.marker([d.lat!, d.lng!], { icon }).addTo(map!);
        marker.bindTooltip(
          `<strong>${escapeHtml(d.name)}</strong><br>${escapeHtml(
            [d.zip_code, d.city].filter(Boolean).join(" "),
          )}${d.street ? `, ${escapeHtml(d.street)}` : ""}`,
          { direction: "top", offset: [0, -28] },
        );
        marker.on("click", () => onToggle(d.id));
        markersRef.current.set(d.id, marker);
      }

      // Apply initial selection styling
      applySelectionStyles(L);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCoords.length]);

  // ── Re-apply marker styles whenever selection changes ──
  useEffect(() => {
    if (markersRef.current.size === 0) return;
    (async () => {
      const L = (await import("leaflet")).default;
      applySelectionStyles(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join("|"), atMax]);

  function applySelectionStyles(L: typeof import("leaflet")) {
    for (const [id, marker] of markersRef.current.entries()) {
      const isOn = selectedIds.includes(id);
      marker.setIcon(makeIcon(L, isOn));
      const el = marker.getElement();
      if (el) {
        if (!isOn && atMax) el.style.opacity = "0.45";
        else el.style.opacity = "1";
      }
    }
  }

  if (withCoords.length === 0) {
    return (
      <div className="dp-map-empty">
        Egyetlen kereskedőnek sincs GPS koordinátája — váltsd át lista nézetre.
      </div>
    );
  }

  return <div ref={containerRef} className="dp-map" />;
}

function makeIcon(L: typeof import("leaflet"), selected: boolean) {
  const bg = selected ? "#10b981" : "#374151";
  const ring = selected ? "#047857" : "#1f2937";
  return L.divIcon({
    className: "dp-marker",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:block;width:22px;height:22px;border-radius:50%;background:${bg};border:3px solid ${ring};box-shadow:0 1px 4px rgba(0,0,0,.25);"></span>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
