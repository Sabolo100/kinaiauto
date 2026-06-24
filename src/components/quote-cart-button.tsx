"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useQuoteCart } from "./quote-context";

/**
 * Topbar cart button — pill with icon + label text.
 * Red dot indicator (no number) appears on the icon when cart is non-empty.
 * When the count increases, the button plays a short "bump" animation so the
 * user sees that the model landed in the top Ajánlatkérések menu.
 */
export function QuoteCartButton() {
  const { count } = useQuoteCart();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 650);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <Link
      href="/ajanlatkeres"
      className={`quote-cart-btn${count > 0 ? " has-items" : ""}${bump ? " bump" : ""}`}
      aria-label={
        count > 0
          ? `Ajánlatkérési kosár · ${count} modell`
          : "Ajánlatkérési kosár"
      }
    >
      <span className="quote-cart-icon">
        <ShoppingBag size={15} aria-hidden />
        {count > 0 ? (
          <span className="quote-cart-count" aria-hidden>
            {count}
          </span>
        ) : null}
      </span>
      <span className="quote-cart-label">Ajánlatkérések</span>
    </Link>
  );
}
