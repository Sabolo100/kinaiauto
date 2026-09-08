export const dynamic = "force-dynamic";
import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { db } from "@/lib/db";
import { DealersTable, type DealerRow } from "@/components/cms/dealers-table";

async function getDealers(): Promise<DealerRow[]> {
  const rows = await db()<(DealerRow & { contacts: { id: string }[] })[]>`
    select d.id, d.name, d.city, d.zip_code, d.phone, d.email, d.is_active,
      json_build_object('name', b.name) as brand,
      coalesce(
        (select json_agg(json_build_object('id', c.id)) from dealer_contacts c where c.dealer_id = d.id),
        '[]'::json) as contacts
    from dealers d
    left join brands b on b.id = d.brand_id`;
  return rows.map((d) => ({ ...d, contact_count: d.contacts?.length ?? 0 }));
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
