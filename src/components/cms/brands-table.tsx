"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type BrandRow = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  archived_at: string | null;
  sort_order: number;
};

type SortKey = "name" | "slug" | "sort_order" | "status";
type Dir = "asc" | "desc";

export function BrandsTable({ rows }: { rows: BrandRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [dir, setDir] = useState<Dir>("asc");

  function toggle(key: SortKey) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDir("asc"); }
  }

  function statusOrd(r: BrandRow) {
    return r.archived_at ? 2 : r.is_active ? 0 : 1;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.slug.toLowerCase().includes(q),
        )
      : rows;

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name")       cmp = a.name.localeCompare(b.name, "hu");
      else if (sortKey === "slug")  cmp = a.slug.localeCompare(b.slug, "hu");
      else if (sortKey === "sort_order") cmp = a.sort_order - b.sort_order;
      else if (sortKey === "status") cmp = statusOrd(a) - statusOrd(b);
      return dir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [rows, search, sortKey, dir]);

  function Th({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th
        className="cms-th-sort"
        onClick={() => toggle(col)}
        aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        ) : (
          <ChevronsUpDown size={11} className="cms-th-sort-idle" />
        )}
      </th>
    );
  }

  return (
    <>
      <div className="cms-table-searchbar">
        <input
          type="search"
          placeholder="Keresés név vagy slug alapján…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search ? (
          <span className="cms-table-count">{filtered.length} találat</span>
        ) : null}
      </div>

      <table className="cms-table">
        <thead>
          <tr>
            <Th col="name" label="Név" />
            <Th col="slug" label="Slug" />
            <Th col="sort_order" label="Sorrend" />
            <Th col="status" label="Státusz" />
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "#94a3b8" }}>
                {search ? "Nincs találat." : "Még nincs márka rögzítve."}
              </td>
            </tr>
          )}
          {filtered.map((b) => (
            <tr key={b.id}>
              <td>
                <Link href={`/c4m5s6/markak/${b.id}`} style={{ color: "#93c5fd" }}>
                  {b.name}
                </Link>
              </td>
              <td>
                <code style={{ color: "#94a3b8" }}>{b.slug}</code>
              </td>
              <td>{b.sort_order}</td>
              <td>
                {b.archived_at ? (
                  <span className="pill muted">Archiválva</span>
                ) : b.is_active ? (
                  <span className="pill ok">Aktív</span>
                ) : (
                  <span className="pill warn">Inaktív</span>
                )}
              </td>
              <td>
                <Link className="cms-btn ghost" href={`/c4m5s6/markak/${b.id}`}>
                  Szerkeszt
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
