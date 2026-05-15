"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useQuoteCart, type QuoteItem } from "./quote-context";

type Props = {
  item: QuoteItem;
  className?: string;
};

/**
 * Larger "Ajánlatot kérek erre a modellre" button intended for use
 * in detail pages, not card grids.
 */
export function QuoteButtonLarge({ item, className }: Props) {
  const cart = useQuoteCart();
  const isIn = cart.has(item.modelId);

  return (
    <button
      type="button"
      className={`quote-btn-large ${isIn ? "on" : ""} ${className ?? ""}`}
      aria-pressed={isIn}
      onClick={() => cart.toggle(item)}
    >
      {isIn ? <Check size={16} /> : <ShoppingBag size={16} />}
      <span>{isIn ? "Hozzáadva az ajánlatkérési listához" : "Ajánlatot kérek erre a modellre"}</span>
    </button>
  );
}
