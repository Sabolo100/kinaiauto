import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { db } from "@/lib/db";
import { ModelsTable, type ModelRow } from "@/components/cms/models-table";

export const dynamic = "force-dynamic";

async function getModels(): Promise<ModelRow[]> {
  // Embeds mirror the old PostgREST shapes: brand{slug,name}, category{label_hu}, drive{label_hu}
  return db()<ModelRow[]>`
    select m.id, m.slug, m.name, m.created_at, m.archived_at, m.is_available, m.price_min_m_ft,
      json_build_object('slug', b.slug, 'name', b.name)  as brand,
      json_build_object('label_hu', c.label_hu)           as category,
      json_build_object('label_hu', d.label_hu)           as drive
    from models m
    left join brands     b on b.id = m.brand_id
    left join categories c on c.id = m.category_id
    left join drives     d on d.id = m.drive_id
    order by m.created_at desc`;
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
