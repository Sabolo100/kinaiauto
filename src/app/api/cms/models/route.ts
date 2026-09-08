import { NextRequest, NextResponse } from "next/server";
import { db, insertOne } from "@/lib/db";
import { syncEngineOptions, type EngineOptionInput } from "./engine-options";

export const runtime = "nodejs";

const ALLOWED = [
  "brand_id","category_id","drive_id","slug","name",
  "price_min_m_ft","price_max_m_ft","is_deal","deal_text",
  "length_mm","width_mm","height_mm","wheelbase_mm","trunk_l","seats",
  "power_hp","battery_kwh","range_km","consumption_text",
  "charging_ac_kw","charging_dc_kw","charging_text","acceleration_s",
  "warranty_text","warranty_years","warranty_km",
  "battery_warranty_years","battery_warranty_km",
  "is_available","is_featured","source_url",
  "meta_title","meta_description","data_updated_at","segment",
] as const;

function pick(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in input) out[k] = input[k];
  return out;
}

export async function GET() {
  try {
    const sql = db();
    // `brand` embedded as { name, slug } — same shape the old PostgREST embed gave.
    const data = await sql`
      select m.*, json_build_object('name', b.name, 'slug', b.slug) as brand
      from models m
      left join brands b on b.id = m.brand_id
      order by m.name asc`;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  if (!body.brand_id || !body.slug || !body.name || !body.category_id || !body.drive_id) {
    return NextResponse.json(
      { error: "brand_id, slug, name, category_id, drive_id kötelező" },
      { status: 400 },
    );
  }
  let data: Record<string, unknown>;
  try {
    data = await insertOne("models", pick(body));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // Engine options sync (optional, only if the form sent any)
  if (Array.isArray(body.engine_options)) {
    const syncErr = await syncEngineOptions(data.id as string, body.engine_options as EngineOptionInput[]);
    if (syncErr) return NextResponse.json({ error: syncErr }, { status: 500 });
  }

  return NextResponse.json(data);
}
