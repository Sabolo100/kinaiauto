// GET /api/cms/model-discovery
// Returns the work table: pending candidates, the brands that can be searched,
// each brand's current live models (for the per-row popup), and the latest job.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DISCOVERY_PROVIDER } from "@/lib/model-discovery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = db();
    const [candidates, brands, models, [latestJob]] = await Promise.all([
      sql`
        select c.*, json_build_object('id', b.id, 'name', b.name, 'slug', b.slug) as brand
        from discovered_models c
        left join brands b on b.id = c.brand_id
        where c.status = 'pending'
        order by c.created_at desc`,
      sql`select id, name, slug, importer_site, is_active, sort_order from brands
          where is_active = true order by sort_order`,
      sql<{ id: string; name: string; slug: string; brand_id: string }[]>`
        select id, name, slug, brand_id from models order by name`,
      sql`select * from model_discovery_jobs order by created_at desc limit 1`,
    ]);

    // Group existing live models by brand for the popup list.
    const existingByBrand: Record<string, { id: string; name: string; slug: string }[]> = {};
    for (const m of models) {
      (existingByBrand[m.brand_id] ??= []).push({ id: m.id, name: m.name, slug: m.slug });
    }

    return NextResponse.json({
      candidates, brands, existingByBrand,
      latestJob: latestJob ?? null,
      provider: DISCOVERY_PROVIDER,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
