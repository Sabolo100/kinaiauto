export const dynamic = "force-dynamic";
import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Row = {
  id: string;
  name: string;
  city: string;
  zip_code: string | null;
  phone: string | null;
  is_active: boolean;
  brand: { name: string } | null;
};

async function getDealers(): Promise<Row[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("dealers")
    .select("id, name, city, zip_code, phone, is_active, brand:brands(name)")
    .order("brand_id").order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Row[];
}

export default async function DealersListPage() {
  const dealers = await getDealers();
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Kereskedők ({dealers.length})</h1>
        <div style={{ flex: 1 }} />
        <Link className="cms-btn primary" href="/c4m5s6/kereskedok/uj">+ Új kereskedő</Link>
      </div>

      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="cms-table">
          <thead>
            <tr>
              <th>Márka</th>
              <th>Kereskedés neve</th>
              <th>Város</th>
              <th>Telefon</th>
              <th>Státusz</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dealers.length === 0 ? (
              <tr><td colSpan={6} style={{ color: "#94a3b8" }}>Még nincs kereskedő rögzítve.</td></tr>
            ) : null}
            {dealers.map((d) => (
              <tr key={d.id}>
                <td style={{ color: "#cbd5e1" }}>{d.brand?.name ?? "—"}</td>
                <td>
                  <Link href={`/c4m5s6/kereskedok/${d.id}`} style={{ color: "#93c5fd" }}>{d.name}</Link>
                </td>
                <td>{d.zip_code ? `${d.zip_code} ` : ""}{d.city}</td>
                <td style={{ color: "#64748b", fontSize: 13 }}>{d.phone ?? "—"}</td>
                <td>
                  {d.is_active
                    ? <span className="pill ok">Aktív</span>
                    : <span className="pill muted">Inaktív</span>}
                </td>
                <td>
                  <Link className="cms-btn ghost" href={`/c4m5s6/kereskedok/${d.id}`}>Szerkeszt</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CmsShell>
  );
}
