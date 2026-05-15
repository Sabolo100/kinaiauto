"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * One entry in the user's ajánlatkérési kosár.
 * We keep snapshots of the names/slugs so the cart still works even
 * if the DB row gets renamed between sessions.
 */
export type QuoteItem = {
  modelId: string;
  brandId: string;
  modelName: string;
  brandName: string;
  modelSlug: string;
  brandSlug: string;
};

type Ctx = {
  items: QuoteItem[];
  add: (i: QuoteItem) => void;
  remove: (modelId: string) => void;
  toggle: (i: QuoteItem) => void;
  has: (modelId: string) => boolean;
  clear: () => void;
  count: number;
};

const QuoteCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "kinaiauto:quote";

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QuoteItem[];
        if (Array.isArray(parsed)) {
          // basic shape check
          const clean = parsed.filter(
            (x) =>
              x &&
              typeof x.modelId === "string" &&
              typeof x.brandId === "string" &&
              typeof x.modelName === "string",
          );
          setItems(clean);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist (skip first render until hydrated, to avoid clobbering stored cart with [])
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const value = useMemo<Ctx>(() => {
    const has = (modelId: string) => items.some((x) => x.modelId === modelId);
    return {
      items,
      count: items.length,
      has,
      add: (i) =>
        setItems((prev) =>
          prev.some((x) => x.modelId === i.modelId) ? prev : [...prev, i],
        ),
      remove: (modelId) =>
        setItems((prev) => prev.filter((x) => x.modelId !== modelId)),
      toggle: (i) =>
        setItems((prev) => {
          if (prev.some((x) => x.modelId === i.modelId)) {
            return prev.filter((x) => x.modelId !== i.modelId);
          }
          return [...prev, i];
        }),
      clear: () => setItems([]),
    };
  }, [items]);

  return <QuoteCtx.Provider value={value}>{children}</QuoteCtx.Provider>;
}

/**
 * Safe-to-call hook. If the provider isn't mounted, returns an empty/no-op
 * shim so SSR / isolated components don't crash.
 */
export function useQuoteCart(): Ctx {
  const ctx = useContext(QuoteCtx);
  if (!ctx) {
    return {
      items: [],
      count: 0,
      has: () => false,
      add: () => {},
      remove: () => {},
      toggle: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
