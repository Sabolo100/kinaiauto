export const dynamic = "force-dynamic";
import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { DealersTable, type DealerRow } from "@/components/cms/dealers-table";

async function getDealers(): Promise<DealerRow[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("dealers")
    .select("id, name, city, zip_code, phone, email, is_active, brand:brands(name)");
  if (error) throw error;
  return (data ?? []) as unknown as DealerRow[];
}

export default async function DealersListPage() {
  const dealers = await getDealers();
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Kereskedők ({dealers.length})</h1>
        <div style={{ flex: 1 }} />
        <Link className="cms-btn" href="/c4m5s6/kereskedok/import">⬆ Import</Link>
        <Link className="cms-btn primary" href="/c4m5s6/kereskedok/uj">+ Új kereskedő</Link>
      </div>

      <div className="cms-card" style={{ padding: 0, overflow: "hidden" }}>
        <DealersTable rows={dealers} />
      </div>
    </CmsShell>
  );
}
