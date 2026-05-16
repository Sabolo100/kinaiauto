import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ModelsTable, type ModelRow } from "@/components/cms/models-table";

export const dynamic = "force-dynamic";

async function getModels(): Promise<ModelRow[]> {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("models")
    .select(
      "id, slug, name, created_at, archived_at, is_available, price_min_m_ft, brand:brands(slug,name), category:categories(label_hu), drive:drives(label_hu)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ModelRow[];
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
        <ModelsTable rows={models} />
      </div>
    </CmsShell>
  );
}
