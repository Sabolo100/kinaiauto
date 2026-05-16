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

      const avgLat = withCoords.reduce((s, d) => s + d.lat!, 0) / withCoords.length;
      const avgLng = withCoords.reduce((s, d) => s + d.lng!, 0) / withCoords.length;
      const zoom = withCoords.length === 1 ? 13 : 7;

      const map = L.map(containerRef.current).setView([avgLat, avgLng], zoom);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersRef.current.clear();

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

        marker.on("click", () => {
          onMarkerClickRef.current?.(d.id);
        });
      });
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
