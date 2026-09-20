"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { useQuoteCart } from "@/components/quote-context";

/** Human title for a route — shown centered in the mobile app bar. */
function titleFor(path: string): string {
  if (path.startsWith("/kinalat")) return "Kínálat";
  if (path.startsWith("/osszehasonlitas")) return "Összehasonlítás";
  if (path.startsWith("/markak")) return "Márkák";
  if (path.startsWith("/modellek")) return "Modellek";
  if (path.startsWith("/tudastar/")) return "Tudástár";
  if (path.startsWith("/tudastar")) return "Tudástár";
  if (path.startsWith("/ajanlatkeres")) return "Ajánlatkérés";
  if (path.startsWith("/impresszum")) return "Impresszum";
  if (path.startsWith("/aszf")) return "ÁSZF";
  if (path.startsWith("/adatkezeles")) return "Adatkezelés";
  if (path.startsWith("/cookie")) return "Cookie beállítások";
  if (path.startsWith("/adatok-torlese")) return "Adatok törlése";
  if (path.startsWith("/jogi-nyilatkozat")) return "Jogi nyilatkozat";
  if (path.startsWith("/offline")) return "Offline";
  return "kínaiautó";
}

/** Where "back" should land when there is no in-app history. */
function parentFor(path: string): string {
  const seg = path.split("/").filter(Boolean);
  if (seg.length >= 2 && (seg[0] === "modellek" || seg[0] === "markak" || seg[0] === "tudastar")) {
    return `/${seg[0]}`;
  }
  return "/";
}

// Counts client-side navigations so we know if router.back() stays in-app.
let navDepth = 0;

export function MobileTopbar() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { count } = useQuoteCart();
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);
  const firstPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== firstPath.current) navDepth += 1;
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 650);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  const isHome = pathname === "/";
  const title = titleFor(pathname);

  function goBack() {
    if (navDepth > 0 && window.history.length > 1) {
      navDepth -= 1;
      router.back();
    } else {
      router.push(parentFor(pathname));
    }
  }

  return (
    <header className={`m-topbar ${scrolled ? "m-topbar--scrolled" : ""} ${isHome ? "m-topbar--home" : ""}`}>
      <div className="m-topbar-inner">
        {isHome ? (
          <Link href="/" className="m-logo" aria-label="kinaiauto.com — főoldal">
            <b>kinaiauto</b>
            <span className="dot" />
            <span className="tld">com</span>
          </Link>
        ) : (
          <button type="button" className="m-back" onClick={goBack} aria-label="Vissza">
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        )}

        {!isHome && <div className="m-title">{title}</div>}

        <Link
          href="/ajanlatkeres"
          className={`m-cart ${count > 0 ? "has-items" : ""} ${bump ? "bump" : ""}`}
          aria-label={count > 0 ? `Ajánlatkérési kosár · ${count} modell` : "Ajánlatkérési kosár"}
        >
          <ShoppingBag size={20} strokeWidth={1.9} />
          {count > 0 ? <span className="m-cart-count">{count}</span> : null}
        </Link>
      </div>
    </header>
  );
}
