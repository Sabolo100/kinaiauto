import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  "meta_title","meta_description","data_updated_at","archived_at",
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
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("models")
    .update(pick(body))
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sa = supabaseAdmin();
  const { error } = await sa
    .from("models")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
