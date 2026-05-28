"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  SlidersHorizontal,
  BarChart3,
  BookOpen,
  ShoppingBag,
  ChevronRight,
  X,
} from "lucide-react";

const SESSION_KEY = "kinai_welcome_seen";

// Ad click-through params: Google Ads (gclid), Facebook (fbclid), or any UTM
function hasAdParam(params: URLSearchParams): boolean {
  return (
    params.has("gclid") ||
    params.has("fbclid") ||
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign") ||
    params.has("welcome") // manual test trigger: ?welcome=1
  );
}

const FEATURES = [
  {
    icon: <SlidersHorizontal size={22} />,
    color: "wp-feat-red",
    label: "Főoldal — Szűrő",
    title: "Válaszd ki, mi számodra a fontos",
    body: "Kategória, ársáv és hajtás alapján egyből látod, melyik kínai modellek illenek hozzád — a teljes hazai kínálatból.",
  },
  {
    icon: <BarChart3 size={22} />,
    color: "wp-feat-blue",
    label: "Kínálat",
    title: "Lásd egymás mellett, ki a legjobb",
    body: "Hatótáv, csomagtartó, méret és ár szerint vizuálisan rendezve. Azonnal kiderül, melyik modell vezet az adott szempontnál.",
  },
  {
    icon: <BookOpen size={22} />,
    color: "wp-feat-green",
    label: "Márkák & Modellek",
    title: "Minden adat, teszt és kereskedő egy helyen",
    body: "Részletes műszaki adatok, tesztvideók, cikkek — és megtalálod a közeledben lévő márkakereskedőket is.",
  },
  {
    icon: <ShoppingBag size={22} />,
    color: "wp-feat-amber",
    label: "Ajánlatkérés",
    title: "Egy lépésben, sok kereskedőtől",
    body: "Bárhol hozzáadhatod a modelleket a kosárhoz (a képernyő tetején látod). Kereskedőket választasz, és egyetlen gombbal árajánlatot kérsz mindegyiktől.",
  },
];

export function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hasAdParam(searchParams)) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Small delay so the page loads first, then popup slides in
    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
    }, 400);
    return () => clearTimeout(t);
  }, [searchParams]);

  function close() {
    setEntered(false);
    setTimeout(() => setVisible(false), 320);
    sessionStorage.setItem(SESSION_KEY, "1");
  }

  if (!visible) return null;

  return (
    <div
      className={`wp-overlay${entered ? " wp-entered" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Üdvözlő bemutatkozás"
    >
      <div className="wp-modal">
        {/* Close */}
        <button className="wp-close" onClick={close} aria-label="Bezárás">
          <X size={16} />
        </button>

        {/* Logo + header */}
        <div className="wp-header">
          <div className="wp-logo-wrap">
            <Image
              src="/logo.png"
              alt="kinaiauto.com"
              width={88}
              height={88}
              className="wp-logo"
              priority
            />
          </div>
          <div className="wp-headline">
            <span className="wp-pre">Ha már döntöttél a kínai autó mellett —</span>
            <h2 className="wp-title">
              mi segítünk eligazodni<br />
              <em>a teljes kínálatban.</em>
            </h2>
            <p className="wp-sub">
              A kínai márkákat még nem ismerjük elég jól. Ezért összegyűjtöttük
              az összes hazai modellt, hogy biztosan a legjobb választást hozd meg.
            </p>
          </div>
        </div>

        {/* Feature grid */}
        <div className="wp-features">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className={`wp-feat${entered ? " wp-feat-in" : ""}`}
              style={{ "--fi": i } as React.CSSProperties}
            >
              <div className={`wp-feat-icon ${f.color}`}>
                {f.icon}
              </div>
              <div className="wp-feat-body">
                <span className="wp-feat-label">{f.label}</span>
                <strong className="wp-feat-title">{f.title}</strong>
                <p className="wp-feat-text">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="wp-footer">
          <button className="wp-cta" onClick={close}>
            Kezdjük a felfedezést
            <ChevronRight size={17} strokeWidth={2.5} />
          </button>
          <span className="wp-footnote">Ingyenes · Regisztráció nélkül</span>
        </div>
      </div>
    </div>
  );
}
