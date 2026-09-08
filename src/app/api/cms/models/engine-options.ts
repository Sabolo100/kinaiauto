// Shared helper used by /api/cms/models POST + /api/cms/models/[id] PATCH.
// Performs a delete-then-insert sync for a model's engine variant rows,
// inside ONE transaction so a mid-way failure can never lose the variants.
//
// The shape sent from the CMS form is forgiving — name + nullable numeric/text
// fields — and we normalise it before insert. An empty array clears existing
// variants for that model.
import { db } from "@/lib/db";

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
  modelId: string,
  options: EngineOptionInput[],
): Promise<string | null> {
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
  try {
    await db().begin(async (tx) => {
      await tx`delete from model_engine_options where model_id = ${modelId}`;
      if (rows.length > 0) await tx`insert into model_engine_options ${tx(rows)}`;
    });
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
