export const dynamic = "force-dynamic";
import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { DealerImport } from "@/components/cms/dealer-import";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getBrands() {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("brands")
    .select("id, name, slug")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; slug: string }[];
}

export default async function DealerImportPage() {
  const brands = await getBrands();
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Kereskedők importálása</h1>
        <div style={{ flex: 1 }} />
        <Link className="cms-btn ghost" href="/c4m5s6/kereskedok">
          ← Vissza a listára
        </Link>
      </div>
      <DealerImport brands={brands} />
    </CmsShell>
  );
}
