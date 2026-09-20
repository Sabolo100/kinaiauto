import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/env";

/**
 * Web App Manifest — served at /manifest.webmanifest.
 * Makes the site installable as a standalone PWA on iOS / Android / desktop.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE_NAME} — Kínai autó iránytű`,
    short_name: "kínaiautó",
    description:
      "Független magyar kínai autó-iránytű: 60+ modell, 15 márka, szűrés, összehasonlítás, ajánlatkérés.",
    lang: "hu",
    dir: "ltr",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#f7f6f2",
    theme_color: "#f7f6f2",
    categories: ["shopping", "lifestyle", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Kínálat",
        short_name: "Kínálat",
        description: "Teljes kínai kínálat vizuálisan",
        url: "/kinalat?source=pwa",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Összehasonlítás",
        short_name: "Összevetés",
        description: "Modellek egymás mellett",
        url: "/osszehasonlitas?source=pwa",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Ajánlatkérés",
        short_name: "Ajánlat",
        description: "Ajánlatkérési kosár",
        url: "/ajanlatkeres?source=pwa",
        icons: [{ src: "/icons/shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
