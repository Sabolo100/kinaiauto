"use client";

import Link from "next/link";
import { GitCompareArrows } from "lucide-react";
import { useCompare } from "./compare-context";
import { encodeCompareToken } from "@/lib/format";

export function CompareBar() {
  const { items, clear } = useCompare();
  const open = items.length > 0;
  const href =
    "/osszehasonlitas?models=" +
    items.map((i) => encodeCompareToken(i.brand, i.name)).join(",");

  return (
    <div
      className={`compare-bar ${open ? "show" : ""}`}
      role="region"
      aria-label="Kiválasztott modellek összehasonlításhoz"
      aria-hidden={!open}
    >
      <div>
        <div className="count">{items.length}/4 kiválasztva</div>
        <div className="names">
          {items.map((it) => (
            <span key={`${it.brand}-${it.name}`}>{it.name}</span>
          ))}
        </div>
      </div>
      <button type="button" className="clear" onClick={clear}>
        Törlés
      </button>
      <Link className="go" href={href}>
        <GitCompareArrows size={14} />
        Összehasonlítás
      </Link>
    </div>
  );
}
