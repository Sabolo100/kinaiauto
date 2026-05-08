"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CompareItem = { brand: string; name: string };

type Ctx = {
  items: CompareItem[];
  add: (i: CompareItem) => void;
  remove: (i: CompareItem) => void;
  toggle: (i: CompareItem) => void;
  clear: () => void;
  has: (i: CompareItem) => boolean;
  max: number;
};

const CompareCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "kinaiauto:compare";

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompareItem[];
        if (Array.isArray(parsed)) setItems(parsed.slice(0, 4));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo<Ctx>(() => {
    const has = (i: CompareItem) =>
      items.some((x) => x.brand === i.brand && x.name === i.name);
    return {
      items,
      max: 4,
      has,
      add: (i) =>
        setItems((prev) =>
          has(i) || prev.length >= 4 ? prev : [...prev, i],
        ),
      remove: (i) =>
        setItems((prev) =>
          prev.filter((x) => !(x.brand === i.brand && x.name === i.name)),
        ),
      toggle: (i) =>
        setItems((prev) => {
          if (prev.some((x) => x.brand === i.brand && x.name === i.name)) {
            return prev.filter(
              (x) => !(x.brand === i.brand && x.name === i.name),
            );
          }
          return prev.length >= 4 ? prev : [...prev, i];
        }),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function useCompare(): Ctx {
  const ctx = useContext(CompareCtx);
  if (!ctx) {
    // Permissive fallback so non-wrapped trees don't crash; renders as empty.
    return {
      items: [],
      max: 4,
      has: () => false,
      add: () => {},
      remove: () => {},
      toggle: () => {},
      clear: () => {},
    };
  }
  return ctx;
}
