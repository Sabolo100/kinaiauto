import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// ─── types ───────────────────────────────────────────────────────────────────

type SortKey = "name" | "brand" | "date";

type Row = {
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

// ─── data ────────────────────────────────────────────────────────────────────

async function getModels(sort: SortKey): Promise<Row[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("models")
    .select(
      "id, slug, name, created_at, archived_at, is_available, price_min_m_ft, brand:brands(slug,name), category:categories(label_hu), drive:drives(label_hu)",
    )
    // Fetch everything; we sort in-memory so brand-name ordering works on the join
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as Row[];

  if (sort === "name") {
    rows.sort((a, b) => a.name.localeCompare(b.name, "hu"));
  } else if (sort === "brand") {
    rows.sort(
      (a, b) =>
        (a.brand?.name ?? "").localeCompare(b.brand?.name ?? "", "hu") ||
        a.name.localeCompare(b.name, "hu"),
    );
  }
  // "date" keeps the created_at desc order from Supabase

  return rows;
}

// ─── page ────────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ sort?: string }> };

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date",  label: "Hozzáadva" },
  { key: "brand", label: "Gyártó" },
  { key: "name",  label: "Abc" },
];

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function ModelsListPage({ searchParams }: Props) {
  const { sort: rawSort } = await searchParams;
  const sort: SortKey =
    rawSort === "brand" || rawSort === "name" ? rawSort : "date";

  const models = await getModels(sort);

  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Modellek ({models.length})</h1>
        <div style={{ flex: 1 }} />

        {/* Sort buttons */}
        <div className="cms-sort-group">
          <span className="cms-sort-label">Rendezés:</span>
          {SORT_OPTIONS.map((opt) => (
            <Link
              key={opt.key}
              href={`/c4m5s6/modellek?sort=${opt.key}`}
              className={`cms-btn ghost${sort === opt.key ? " active" : ""}`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <Link className="cms-btn primary" href="/c4m5s6/modellek/uj">
          + Új modell
        </Link>
      </div>

      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Márka</th>
              <th>Modell</th>
              <th>Kategória</th>
              <th>Hajtás</th>
              <th>Alapár</th>
              {sort === "date" && <th>Hozzáadva</th>}
              <th>Státusz</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
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
                  {m.price_min_m_ft != null
                    ? `${m.price_min_m_ft} M Ft`
                    : <span style={{ color: "#64748b" }}>—</span>}
                </td>
                {sort === "date" && (
                  <td style={{ color: "#64748b", fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>
                    {fmtDate(m.created_at)}
                  </td>
                )}
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
      </div>
    </CmsShell>
  );
}
