"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type DealerRow = {
  id: string;
  name: string;
  city: string;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  brand: { name: string } | null;
  contact_count: number;
};

type SortKey = "brand" | "name" | "city" | "status";
type Dir = "asc" | "desc";

// ─── Inline email cell ────────────────────────────────────────────────────────
function InlineEmailCell({ dealerId, initial }: { dealerId: string; initial: string | null }) {
  const [val, setVal] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [err, setErr]       = useState(false);
  const savedVal = useRef(initial ?? ""); // tracks the last persisted value

  async function save() {
    const trimmed = val.trim();
    if (trimmed === savedVal.current) return; // nothing changed
    setSaving(true);
    setSaved(false);
    setErr(false);
    try {
      const res = await fetch(`/api/cms/dealers/${dealerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed || null }),
      });
      if (!res.ok) throw new Error();
      savedVal.current = trimmed;
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch {
      setErr(true);
      setTimeout(() => setErr(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const hasEmail = val.trim().length > 0;

  return (
    <div className="dl-email-cell">
      {/* Has-email indicator dot */}
      <span
        className={`dl-email-dot${hasEmail ? " has" : " missing"}`}
        title={hasEmail ? "Van e-mail" : "Hiányzó e-mail"}
      />
      <input
        type="email"
        className={`dl-email-input${err ? " err" : ""}`}
        value={val}
        placeholder="nincs e-mail"
        onChange={(e) => { setVal(e.target.value); setSaved(false); setErr(false); }}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
      />
      {saving && <span className="dl-email-status">…</span>}
      {saved  && <span className="dl-email-status ok">✓</span>}
      {err    && <span className="dl-email-status err">✗</span>}
    </div>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────
export function DealersTable({ rows }: { rows: DealerRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [dir, setDir] = useState<Dir>("asc");

  function toggle(key: SortKey) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setDir("asc"); }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            (r.brand?.name ?? "").toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q) ||
            (r.zip_code ?? "").toLowerCase().includes(q) ||
            (r.email ?? "").toLowerCase().includes(q),
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
      } else if (sortKey === "city") {
        cmp = a.city.localeCompare(b.city, "hu");
      } else if (sortKey === "status") {
        cmp = (a.is_active ? 0 : 1) - (b.is_active ? 0 : 1);
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
          placeholder="Keresés márka, név, város vagy e-mail alapján…"
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
            <Th col="name" label="Kereskedés neve" />
            <Th col="city" label="Város" />
            <th>Telefon</th>
            <th>E-mail</th>
            <th>Kontaktok</th>
            <Th col="status" label="Státusz" />
            <th />
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} style={{ color: "#94a3b8" }}>
                {search ? "Nincs találat." : "Még nincs kereskedő rögzítve."}
              </td>
            </tr>
          )}
          {filtered.map((d) => (
            <tr key={d.id}>
              <td style={{ color: "#cbd5e1" }}>{d.brand?.name ?? "—"}</td>
              <td>
                <Link
                  href={`/c4m5s6/kereskedok/${d.id}`}
                  style={{ color: "#93c5fd" }}
                >
                  {d.name}
                </Link>
              </td>
              <td>
                {d.zip_code ? `${d.zip_code} ` : ""}
                {d.city}
              </td>
              <td style={{ color: "#64748b", fontSize: 13 }}>
                {d.phone ?? "—"}
              </td>
              <td style={{ padding: "6px 8px" }}>
                <InlineEmailCell dealerId={d.id} initial={d.email} />
              </td>
              <td>
                {d.contact_count > 0 ? (
                  <span className="pill ok">{d.contact_count} kontakt</span>
                ) : (
                  <span className="pill muted">nincs</span>
                )}
              </td>
              <td>
                {d.is_active ? (
                  <span className="pill ok">Aktív</span>
                ) : (
                  <span className="pill muted">Inaktív</span>
                )}
              </td>
              <td>
                <Link
                  className="cms-btn ghost"
                  href={`/c4m5s6/kereskedok/${d.id}`}
                >
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
