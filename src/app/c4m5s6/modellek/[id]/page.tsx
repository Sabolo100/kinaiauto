import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { ModelForm, type EngineOptionInput } from "@/components/cms/model-form";
import { getLookups } from "@/lib/cms-lookups";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Raw `models` table row (the v_models view type in lib/types differs).
type ModelDbRow = {
  id: string; brand_id: string; category_id: number; drive_id: number; slug: string; name: string;
  price_min_m_ft: number | null; price_max_m_ft: number | null; is_deal: boolean | null; deal_text: string | null;
  length_mm: number | null; width_mm: number | null; height_mm: number | null; wheelbase_mm: number | null;
  trunk_l: number | null; seats: number | null; power_hp: number | null; battery_kwh: number | null;
  range_km: number | null; consumption_text: string | null; charging_ac_kw: number | null;
  charging_dc_kw: number | null; charging_text: string | null; acceleration_s: number | null;
  warranty_years: number | null; warranty_km: number | null; battery_warranty_years: number | null;
  battery_warranty_km: number | null; source_url: string | null; data_updated_at: string | null;
  is_available: boolean | null; is_featured: boolean | null; archived_at: string | null; segment: string | null;
};
type EngineOptRow = {
  id: string; name: string | null; range_km: number | null; power_hp: number | null; battery_kwh: number | null;
  trunk_l: number | null; seats: number | null; consumption_text: string | null; charging_ac_kw: number | null;
  charging_dc_kw: number | null; charging_text: string | null; acceleration_s: number | null;
};

export default async function EditModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = db();

  const [[r], photos, options, lk] = await Promise.all([
    sql<ModelDbRow[]>`select * from models where id = ${id}`,
    sql<{ id: string; storage_path: string; kind: string; is_primary: boolean }[]>`
      select id, storage_path, kind, is_primary from model_photos
      where model_id = ${id} order by sort_order asc`,
    sql<EngineOptRow[]>`
      select id, name, range_km, power_hp, battery_kwh, trunk_l, seats, consumption_text,
             charging_ac_kw, charging_dc_kw, charging_text, acceleration_s
      from model_engine_options where model_id = ${id} order by sort_order asc`,
    getLookups(),
  ]);
  if (!r) return notFound();

  const engineOptions: EngineOptionInput[] = options.map((o) => ({
    id: o.id,
    name: o.name ?? "Base",
    range_km: o.range_km,
    power_hp: o.power_hp,
    battery_kwh: o.battery_kwh,
    trunk_l: o.trunk_l,
    seats: o.seats,
    consumption_text: o.consumption_text,
    charging_ac_kw: o.charging_ac_kw,
    charging_dc_kw: o.charging_dc_kw,
    charging_text: o.charging_text,
    acceleration_s: o.acceleration_s,
  }));

  return (
    <CmsShell>
      <h1>{r.name}</h1>
      <p className="lede">Slug: <code>{r.slug}</code></p>
      <ModelForm
        mode="edit"
        brands={lk.brands}
        categories={lk.categories}
        drives={lk.drives}
        photos={photos}
        initialEngineOptions={engineOptions}
        initial={{
          id: r.id,
          brand_id: r.brand_id,
          category_id: r.category_id,
          drive_id: r.drive_id,
          slug: r.slug,
          name: r.name,
          price_min_m_ft: r.price_min_m_ft,
          price_max_m_ft: r.price_max_m_ft,
          is_deal: r.is_deal ?? false,
          deal_text: r.deal_text,
          length_mm: r.length_mm,
          width_mm: r.width_mm,
          height_mm: r.height_mm,
          wheelbase_mm: r.wheelbase_mm,
          trunk_l: r.trunk_l,
          seats: r.seats,
          power_hp: r.power_hp,
          battery_kwh: r.battery_kwh,
          range_km: r.range_km,
          consumption_text: r.consumption_text,
          charging_ac_kw: r.charging_ac_kw,
          charging_dc_kw: r.charging_dc_kw,
          charging_text: r.charging_text,
          acceleration_s: r.acceleration_s,
          warranty_years: r.warranty_years,
          warranty_km: r.warranty_km,
          battery_warranty_years: r.battery_warranty_years,
          battery_warranty_km: r.battery_warranty_km,
          source_url: r.source_url,
          data_updated_at: r.data_updated_at,
          is_available: r.is_available ?? true,
          is_featured: r.is_featured ?? false,
          archived_at: r.archived_at,
          segment: r.segment ?? null,
        }}
      />
    </CmsShell>
  );
}
