import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BrandsTable, type BrandRow } from "@/components/cms/brands-table";

export const dynamic = "force-dynamic";

async function getBrands(): Promise<BrandRow[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("brands")
    .select("id, slug, name, is_active, archived_at, sort_order");
  if (error) throw error;
  return (data ?? []) as BrandRow[];
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
        <BrandsTable rows={brands} />
      </div>
    </CmsShell>
  );
}
