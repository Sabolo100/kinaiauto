"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useQuoteCart } from "./quote-context";

/**
 * Topbar cart button. Always renders a link to /ajanlatkeres.
 * Shows a small numeric badge when the cart is non-empty.
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
      title="Ajánlatkérési kosár"
    >
      <ShoppingBag size={16} aria-hidden />
      {count > 0 ? (
        <span className="quote-cart-badge" aria-hidden>
          {count}
        </span>
      ) : null}
    </Link>
  );
}
