"use client";

import { useEffect, useRef } from "react";
import type { Dealer } from "@/lib/types";

interface Props {
  dealers: Dealer[];
  /** ID of the dealer whose popup should be open (controlled from parent) */
  activeId?: string | null;
  /** Called when the user clicks a marker on the map */
  onMarkerClick?: (id: string) => void;
}

export function DealerMap({ dealers, activeId, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

  // Keep latest callback in a ref so marker click handlers never go stale
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);

  const withCoords = dealers.filter((d) => d.lat != null && d.lng != null);

  // ── Map initialisation (runs once per mount / when dealer count changes) ──
  useEffect(() => {
    if (!containerRef.current || withCoords.length === 0) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      if (cancelled || !containerRef.current) return;

      // Fix default icon path broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Inject Leaflet CSS once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // Default view: Hungary. Markers are framed afterwards via fitBounds,
      // so even with sparse/odd coordinates the map never drifts off (e.g. to
      // the sea) the way a naive average-of-points center could.
      const HUNGARY_CENTER: [number, number] = [47.16, 19.5];
      const map = L.map(containerRef.current).setView(HUNGARY_CENTER, 7);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current.clear();

      const latLngs: [number, number][] = [];
      withCoords.forEach((d) => {
        const popup = `
          <strong>${d.name}</strong><br>
          ${d.zip_code ? d.zip_code + " " : ""}${d.city}${d.street ? ", " + d.street : ""}
          ${d.phone ? "<br>☎ " + d.phone : ""}
          ${d.email ? "<br>✉ " + d.email : ""}
          ${d.website ? `<br><a href="${d.website}" target="_blank" rel="noopener">Honlap →</a>` : ""}
        `;
        const marker = L.marker([d.lat!, d.lng!]).addTo(map).bindPopup(popup);
        markersRef.current.set(d.id, marker);
        latLngs.push([d.lat!, d.lng!]);

        marker.on("click", () => {
          onMarkerClickRef.current?.(d.id);
        });
      });

      // Frame the markers: single dealer → zoom in; multiple → fit all.
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 13);
      } else if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40], maxZoom: 12 });
      }
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCoords.length]);

  // ── React to activeId changes: open popup + pan to marker ──
  useEffect(() => {
    if (activeId == null || !mapRef.current) return;
    const marker = markersRef.current.get(activeId);
    if (marker) {
      marker.openPopup();
      mapRef.current.panTo(marker.getLatLng(), { animate: true });
    }
  }, [activeId]);

  if (withCoords.length === 0) {
    return (
      <div className="dealer-map-placeholder">
        Nincs GPS koordináta a kereskedőknél. Adj meg koordinátákat az admin felületen.
      </div>
    );
  }

  return <div ref={containerRef} className="dealer-map" />;
}
