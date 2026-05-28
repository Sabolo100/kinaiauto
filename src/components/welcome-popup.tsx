"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  BarChart3,
  BookOpen,
  ShoppingBag,
  ChevronRight,
  X,
} from "lucide-react";

const SESSION_KEY = "kinai_welcome_seen";

function hasAdParam(params: URLSearchParams): boolean {
  return (
    params.has("gclid") ||
    params.has("fbclid") ||
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign") ||
    params.has("welcome")
  );
}

const FEATURES = [
  {
    icon: <SlidersHorizontal size={24} />,
    color: "wp-c-red",
    nav: "Főoldal — Szűrő",
    title: "Válaszd ki, mi számodra a fontos",
    body: "Kategória, ársáv és hajtás alapján egyből látod, melyik kínai modellek illenek hozzád — a teljes hazai kínálatból.",
  },
  {
    icon: <BarChart3 size={24} />,
    color: "wp-c-blue",
    nav: "Kínálat",
    title: "Lásd egymás mellett, ki a legjobb",
    body: "Hatótáv, csomagtartó, méret és ár szerint vizuálisan rendezve. Azonnal kiderül, melyik modell vezet az adott szempontnál.",
  },
  {
    icon: <BookOpen size={24} />,
    color: "wp-c-green",
    nav: "Márkák & Modellek",
    title: "Minden adat, teszt és kereskedő egy helyen",
    body: "Részletes műszaki adatok, tesztvideók, cikkek — és a közeledben lévő márkakereskedők elérhetőségei is.",
  },
  {
    icon: <ShoppingBag size={24} />,
    color: "wp-c-amber",
    nav: "Ajánlatkérés",
    title: "Egy lépésben, sok kereskedőtől",
    body: "Bárhol hozzáadhatod a modelleket a kosárhoz (a képernyő tetején látod). Kereskedőket választasz, majd egyetlen gombbal árajánlatot kérsz mindegyiktől.",
  },
];

export function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hasAdParam(searchParams)) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const t = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setEntered(true))
      );
    }, 350);
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
          <X size={15} />
        </button>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="wp-header">
          <div className="wp-logo-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="kinaiauto.com logó"
              className="wp-logo"
              width={100}
              height={100}
            />
          </div>
          <div className="wp-headline">
            <span className="wp-eyebrow">Ha már döntöttél a kínai autó mellett —</span>
            <h2 className="wp-title">
              mi segítünk<br />
              <span className="wp-title-accent">eligazodni a kínálatban.</span>
            </h2>
            <p className="wp-desc">
              A kínai márkákat még nem ismerjük jól. Összegyűjtöttük az összes
              hazai modellt, hogy biztosan a legjobb választást hozd meg.
            </p>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div className="wp-divider" />

        {/* ── Feature grid ───────────────────────────────────────── */}
        <div className="wp-features">
          {FEATURES.map((f, i) => (
            <div
              key={f.nav}
              className={`wp-feat${entered ? " wp-feat-in" : ""}`}
              style={{ "--fi": i } as React.CSSProperties}
            >
              <div className={`wp-feat-icon-wrap ${f.color}`}>
                {f.icon}
              </div>
              <div className="wp-feat-content">
                <span className="wp-feat-nav">{f.nav}</span>
                <strong className="wp-feat-title">{f.title}</strong>
                <p className="wp-feat-body">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ────────────────────────────────────────────────── */}
        <div className="wp-footer">
          <button className="wp-cta" onClick={close}>
            <span>Kezdjük a felfedezést</span>
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
          <p className="wp-note">Ingyenes · Regisztráció nélkül · 60+ modell</p>
        </div>

      </div>
    </div>
  );
}
