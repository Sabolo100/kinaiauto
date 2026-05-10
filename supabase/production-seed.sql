-- =====================================================================
-- kinaiauto.com — PRODUCTION SEED (run AFTER schema.sql)
-- =====================================================================
-- Purpose:
--   Convert the dev/test seed into a clean production baseline.
--
--   Brands  → kept fully populated (the seeded brand info is real-world).
--   Models  → identification only (brand, name, slug, category, drive).
--             All prices, dimensions, powertrain, charging, warranty,
--             availability metadata are wiped — the CMS / extractions
--             pipeline fills these in.
--   Trims   → cleared (filled per model from the CMS).
--   Photos  → cleared (uploaded per model from the CMS).
--
-- Idempotent — safe to re-run.
-- =====================================================================

begin;

-- 1) Wipe trims (dev seed produced 3 generic trims per model with prices)
truncate table model_trims restart identity;

-- 2) Wipe photos (dev seed inserted the Tiggo 8 demo photo)
truncate table model_photos restart identity;

-- 3) Strip prices, specs, charging, warranty, etc. from every model.
update models set
  price_min_m_ft         = null,
  price_max_m_ft         = null,
  is_deal                = false,
  deal_text              = null,
  length_mm              = null,
  width_mm               = null,
  height_mm              = null,
  wheelbase_mm           = null,
  trunk_l                = null,
  seats                  = null,
  power_hp               = null,
  battery_kwh            = null,
  range_km               = null,
  consumption_text       = null,
  charging_ac_kw         = null,
  charging_dc_kw         = null,
  charging_text          = null,
  acceleration_s         = null,
  warranty_text          = null,
  warranty_years         = null,
  warranty_km            = null,
  battery_warranty_years = null,
  battery_warranty_km    = null,
  source_url             = null,
  meta_title             = null,
  meta_description       = null,
  data_updated_at        = null,
  is_available           = true,
  is_featured            = false;

-- 4) Sanity: brand/model identification is preserved.
--    select b.name, m.name, c.label_hu, d.label_hu
--      from models m
--      join brands b on b.id = m.brand_id
--      join categories c on c.id = m.category_id
--      join drives d on d.id = m.drive_id
--      order by b.sort_order, m.name;

-- 5) Reset the data freshness pill so the topbar isn't claiming stale data.
--    (v_data_freshness picks the max(updated_at) which is "now" after this script.)

commit;

-- =====================================================================
-- DONE.
-- =====================================================================
