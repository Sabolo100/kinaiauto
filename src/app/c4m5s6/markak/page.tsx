import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  archived_at: string | null;
  sort_order: number;
};

async function getBrands(): Promise<Row[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("brands")
    .select("id, slug, name, is_active, archived_at, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Row[];
}

export default async function BrandsListPage() {
  const brands = await getBrands();
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Márkák ({brands.length})</h1>
        <div style={{ flex: 1 }} />
        <Link className="cms-btn primary" href="/c4m5s6/markak/uj">
          + Új márka
        </Link>
      </div>

      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Név</th>
              <th>Slug</th>
              <th>Sorrend</th>
              <th>Státusz</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link href={`/c4m5s6/markak/${b.id}`} style={{ color: "#93c5fd" }}>
                    {b.name}
                  </Link>
                </td>
                <td><code style={{ color: "#94a3b8" }}>{b.slug}</code></td>
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
      </div>
    </CmsShell>
  );
}
