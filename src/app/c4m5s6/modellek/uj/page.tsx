import { CmsShell } from "@/components/cms/cms-shell";
import { ModelForm } from "@/components/cms/model-form";
import { getLookups } from "@/lib/cms-lookups";

export const dynamic = "force-dynamic";

export default async function NewModelPage() {
  const lk = await getLookups();
  return (
    <CmsShell>
      <h1>Új modell</h1>
      <p className="lede">Mentés után tudsz fotókat feltölteni.</p>
      <ModelForm
        mode="create"
        brands={lk.brands}
        categories={lk.categories}
        drives={lk.drives}
        initial={{
          brand_id: "",
          category_id: 0,
          drive_id: 0,
          slug: "",
          name: "",
          price_min_m_ft: null,
          price_max_m_ft: null,
          is_deal: false,
          deal_text: null,
          length_mm: null,
          width_mm: null,
          height_mm: null,
          wheelbase_mm: null,
          trunk_l: null,
          seats: null,
          power_hp: null,
          battery_kwh: null,
          range_km: null,
          consumption_text: null,
          charging_ac_kw: null,
          charging_dc_kw: null,
          charging_text: null,
          acceleration_s: null,
          warranty_years: null,
          warranty_km: null,
          battery_warranty_years: null,
          battery_warranty_km: null,
          source_url: null,
          data_updated_at: null,
          is_available: true,
          is_featured: false,
          archived_at: null,
        }}
      />
    </CmsShell>
  );
}
