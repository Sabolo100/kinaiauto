// POST /api/cms/model-discovery/search
// Creates a discovery job (which brands to research) and returns the jobId.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sql = db();

  // brand_ids optional — empty/missing means "all active brands".
  let brandIds: string[] = Array.isArray(body?.brand_ids) ? body.brand_ids : [];
  if (brandIds.length === 0) {
    const rows = await sql<{ id: string }[]>`select id from brands where is_active = true order by sort_order`;
    brandIds = rows.map((b) => b.id);
  }
  if (brandIds.length === 0) {
    return NextResponse.json({ error: "nincs kereshető márka" }, { status: 400 });
  }

  try {
    // brand_ids is jsonb → stringify + cast (a bare JS array would become text[]).
    const [job] = await sql<{ id: string }[]>`
      insert into model_discovery_jobs (status, brand_ids, progress, total_found)
      values ('pending', ${JSON.stringify(brandIds)}::jsonb, '{}'::jsonb, 0)
      returning id`;
    return NextResponse.json({ jobId: job.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "failed to create job" }, { status: 500 });
  }
}
