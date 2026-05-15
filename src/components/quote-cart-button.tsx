"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useQuoteCart } from "./quote-context";

/**
 * Topbar cart button — pill with icon + label text.
 * Red dot indicator (no number) appears on the icon when cart is non-empty.
 */
export function QuoteCartButton() {
  const { count } = useQuoteCart();
  return (
    <Link
      href="/ajanlatkeres"
      className="quote-cart-btn"
      aria-label={
        count > 0
          ? `Ajánlatkérési kosár · ${count} modell`
          : "Ajánlatkérési kosár"
      }
    >
      <span className="quote-cart-icon">
        <ShoppingBag size={15} aria-hidden />
        {count > 0 ? <span className="quote-cart-dot" aria-hidden /> : null}
      </span>
      <span className="quote-cart-label">Ajánlatkérések</span>
    </Link>
  );
}
