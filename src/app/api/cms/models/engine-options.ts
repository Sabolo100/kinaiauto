// Shared helper used by /api/cms/models POST + /api/cms/models/[id] PATCH.
// Performs a delete-then-insert sync for a model's engine variant rows.
//
// The shape sent from the CMS form is forgiving — name + nullable numeric/text
// fields — and we normalise it before insert. An empty array clears existing
// variants for that model.

import type { SupabaseClient } from "@supabase/supabase-js";

export type EngineOptionInput = {
  id?: string;
  name?: string | null;
  range_km?: number | null;
  power_hp?: number | null;
  battery_kwh?: number | null;
  trunk_l?: number | null;
  seats?: number | null;
  consumption_text?: string | null;
  charging_ac_kw?: number | null;
  charging_dc_kw?: number | null;
  charging_text?: string | null;
  acceleration_s?: number | null;
};

export async function syncEngineOptions(
  sa: SupabaseClient,
  modelId: string,
  options: EngineOptionInput[],
): Promise<string | null> {
  const del = await sa
    .from("model_engine_options")
    .delete()
    .eq("model_id", modelId);
  if (del.error) return del.error.message;

  if (options.length === 0) return null;

  const rows = options.map((o, i) => ({
    model_id: modelId,
    name: (o.name ?? "").trim() || "Base",
    range_km: o.range_km ?? null,
    power_hp: o.power_hp ?? null,
    battery_kwh: o.battery_kwh ?? null,
    trunk_l: o.trunk_l ?? null,
    seats: o.seats ?? null,
    consumption_text: (o.consumption_text ?? "").trim() || null,
    charging_ac_kw: o.charging_ac_kw ?? null,
    charging_dc_kw: o.charging_dc_kw ?? null,
    charging_text: (o.charging_text ?? "").trim() || null,
    acceleration_s: o.acceleration_s ?? null,
    sort_order: i,
  }));

  const ins = await sa.from("model_engine_options").insert(rows);
  if (ins.error) return ins.error.message;
  return null;
}
