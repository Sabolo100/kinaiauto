import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  archived_at: string | null;
  is_available: boolean;
  price_min_m_ft: number | null;
  brand: { slug: string; name: string } | null;
  category: { label_hu: string } | null;
  drive: { label_hu: string } | null;
};

async function getModels(): Promise<Row[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("models")
    .select(
      "id, slug, name, archived_at, is_available, price_min_m_ft, brand:brands(slug,name), category:categories(label_hu), drive:drives(label_hu)",
    )
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

export default async function ModelsListPage() {
  const models = await getModels();
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Modellek ({models.length})</h1>
        <div style={{ flex: 1 }} />
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
