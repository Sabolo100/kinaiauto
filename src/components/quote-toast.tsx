"use client";

import { Check } from "lucide-react";
import { useQuoteCart } from "./quote-context";

/**
 * Global toast notification for quote-cart actions.
 * Mount once inside <QuoteProvider> in the root layout.
 */
export function QuoteToast() {
  const { toastMsg } = useQuoteCart();

  return (
    <div
      className={`quote-toast ${toastMsg ? "quote-toast--visible" : ""}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {toastMsg ? (
        <>
          <Check size={14} aria-hidden />
          {toastMsg}
        </>
      ) : null}
    </div>
  );
}
