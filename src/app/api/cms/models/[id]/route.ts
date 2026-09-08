import { NextRequest, NextResponse } from "next/server";
import { db, updateById } from "@/lib/db";
import { syncEngineOptions, type EngineOptionInput } from "../engine-options";

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
  "meta_title","meta_description","data_updated_at","archived_at","segment",
] as const;

function pick(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in input) out[k] = input[k];
  return out;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const picked = pick(body);
  // Skip the model-row update if the request only carries auxiliary keys
  // (e.g. engine_options only) and no model column changes.
  let data: Record<string, unknown> | null = null;
  if (Object.keys(picked).length > 0) {
    try {
      data = await updateById("models", id, picked);
      if (!data) return NextResponse.json({ error: "modell nem található" }, { status: 404 });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  }

  // Engine options sync (optional)
  if (Array.isArray(body.engine_options)) {
    const syncErr = await syncEngineOptions(id, body.engine_options as EngineOptionInput[]);
    if (syncErr) return NextResponse.json({ error: syncErr }, { status: 500 });
  }

  return NextResponse.json(data ?? { id });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  try {
    // Soft-delete via archive
    await db()`update models set archived_at = now() where id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
