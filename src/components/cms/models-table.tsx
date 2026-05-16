"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type ModelRow = {
  id: string;
  slug: string;
  name: string;
  created_at: string | null;
  archived_at: string | null;
  is_available: boolean;
  price_min_m_ft: number | null;
  brand: { slug: string; name: string } | null;
  category: { label_hu: string } | null;
  drive: { label_hu: string } | null;
};

type SortKey = "brand" | "name" | "category" | "drive" | "price" | "status" | "date";
type Dir = "asc" | "desc";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function ModelsTable({ rows }: { rows: ModelRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [dir, setDir] = useState<Dir>("asc");

  function toggle(key: SortKey) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDir("asc"); }
  }

  function statusOrd(r: ModelRow) {
    return r.archived_at ? 2 : r.is_available ? 0 : 1;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.brand?.name ?? "").toLowerCase().includes(q) ||
            (r.category?.label_hu ?? "").toLowerCase().includes(q) ||
            (r.drive?.label_hu ?? "").toLowerCase().includes(q),
        )
      : rows;

    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "brand") {
        cmp =
          (a.brand?.name ?? "").localeCompare(b.brand?.name ?? "", "hu") ||
          a.name.localeCompare(b.name, "hu");
      } else if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name, "hu");
      } else if (sortKey === "category") {
        cmp = (a.category?.label_hu ?? "").localeCompare(
          b.category?.label_hu ?? "",
          "hu",
        );
      } else if (sortKey === "drive") {
        cmp = (a.drive?.label_hu ?? "").localeCompare(
          b.drive?.label_hu ?? "",
          "hu",
        );
      } else if (sortKey === "price") {
        cmp = (a.price_min_m_ft ?? 0) - (b.price_min_m_ft ?? 0);
      } else if (sortKey === "status") {
        cmp = statusOrd(a) - statusOrd(b);
      } else if (sortKey === "date") {
        cmp =
          (a.created_at ?? "").localeCompare(b.created_at ?? "");
      }
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
          placeholder="Keresés modell, márka, kategória vagy hajtás alapján…"
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
            <Th col="brand" label="Márka" />
            <Th col="name" label="Modell" />
            <Th col="category" label="Kategória" />
            <Th col="drive" label="Hajtás" />
            <Th col="price" label="Alapár" />
            <Th col="date" label="Hozzáadva" />
            <Th col="status" label="Státusz" />
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} style={{ color: "#94a3b8" }}>
                {search ? "Nincs találat." : "Még nincs modell rögzítve."}
              </td>
            </tr>
          )}
          {filtered.map((m) => (
            <tr key={m.id}>
              <td style={{ color: "#cbd5e1" }}>{m.brand?.name ?? "—"}</td>
              <td>
                <Link href={`/c4m5s6/modellek/${m.id}`} style={{ color: "#93c5fd" }}>
                  {m.name}
                </Link>
              </td>
              <td>{m.category?.label_hu ?? "—"}</td>
              <td>{m.drive?.label_hu ?? "—"}</td>
              <td>
                {m.price_min_m_ft != null ? (
                  `${m.price_min_m_ft} M Ft`
                ) : (
                  <span style={{ color: "#64748b" }}>—</span>
                )}
              </td>
              <td
                style={{
                  color: "#64748b",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 12,
                }}
              >
                {fmtDate(m.created_at)}
              </td>
              <td>
                {m.archived_at ? (
                  <span className="pill muted">Archiválva</span>
                ) : m.is_available ? (
                  <span className="pill ok">Elérhető</span>
                ) : (
                  <span className="pill warn">Rejtett</span>
                )}
              </td>
              <td>
                <Link className="cms-btn ghost" href={`/c4m5s6/modellek/${m.id}`}>
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
