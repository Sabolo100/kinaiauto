import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { ModelForm, type EngineOptionInput } from "@/components/cms/model-form";
import { getLookups } from "@/lib/cms-lookups";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function EditModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sa = supabaseAdmin();

  const [m, photos, options, lk] = await Promise.all([
    sa.from("models").select("*").eq("id", id).single(),
    sa
      .from("model_photos")
      .select("id, storage_path, kind, is_primary")
      .eq("model_id", id)
      .order("sort_order", { ascending: true }),
    sa
      .from("model_engine_options")
      .select("id, name, range_km, power_hp, battery_kwh, trunk_l, seats, consumption_text, charging_ac_kw, charging_dc_kw, charging_text, acceleration_s")
      .eq("model_id", id)
      .order("sort_order", { ascending: true }),
    getLookups(),
  ]);
  if (m.error || !m.data) return notFound();

  const r = m.data;
  const engineOptions: EngineOptionInput[] = (options.data ?? []).map((o) => ({
    id: o.id as string,
    name: (o.name as string) ?? "Base",
    range_km: o.range_km as number | null,
    power_hp: o.power_hp as number | null,
    battery_kwh: o.battery_kwh as number | null,
    trunk_l: o.trunk_l as number | null,
    seats: o.seats as number | null,
    consumption_text: o.consumption_text as string | null,
    charging_ac_kw: o.charging_ac_kw as number | null,
    charging_dc_kw: o.charging_dc_kw as number | null,
    charging_text: o.charging_text as string | null,
    acceleration_s: o.acceleration_s as number | null,
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
        photos={(photos.data ?? []) as { id: string; storage_path: string; kind: string; is_primary: boolean }[]}
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
