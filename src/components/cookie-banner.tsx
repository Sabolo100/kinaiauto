"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ConsentChoice = "all" | "necessary";

// ─── gtag consent helper ──────────────────────────────────────────────────────
function updateConsent(choice: ConsentChoice) {
  const win = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof win.gtag !== "function") return;
  if (choice === "all") {
    win.gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  } else {
    win.gtag("consent", "update", {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_consent")) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function accept(choice: ConsentChoice) {
    try {
      localStorage.setItem("cookie_consent", choice);
    } catch {}
    updateConsent(choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie beállítások">
      <div className="cookie-banner-inner">
        <p className="cookie-banner-text">
          Az oldal sütiket és hasonló technológiákat használ a látogatottság mérésére és a hirdetések
          személyre szabásához.{" "}
          <a href="/adatvedelmi-tajekoztato" className="cookie-banner-link">
            Adatvédelmi tájékoztató
          </a>
        </p>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn cookie-btn-secondary"
            onClick={() => accept("necessary")}
          >
            Csak szükséges
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={() => accept("all")}
          >
            Mindet elfogadom
          </button>
        </div>
      </div>
    </div>
  );
}
