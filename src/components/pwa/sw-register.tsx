"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Registers /sw.js in production and shows a one-tap "Frissítés" pill when a
 * new version has been installed in the background.
 */
export function SwRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const enabled =
      process.env.NODE_ENV === "production" ||
      new URLSearchParams(window.location.search).has("pwa-dev");
    if (!enabled) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) setWaiting(nw);
          });
        });
        // check for updates when the app comes back to the foreground
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") reg.update().catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  if (!waiting) return null;
  return (
    <button
      type="button"
      className="sw-update"
      onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
    >
      <RefreshCw size={14} /> Új verzió elérhető · Frissítés
    </button>
  );
}
