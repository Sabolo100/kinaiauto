-- =====================================================================
-- Migration: add source_url to v_models view
-- Run once in the Supabase SQL Editor.
--
-- Background: source_url was stored in models.source_url but was
-- missing from the v_models view SELECT list. As a result the field
-- always returned NULL on the public site even when a value was saved
-- in the CMS (e.g. Omoda 5, Dongfeng models).
--
-- Fix: rebuild the view with source_url included.
-- The full canonical view definition lives in v-models-hide-archived.sql.
-- =====================================================================

-- DROP first because CREATE OR REPLACE cannot reorder existing columns
drop view if exists v_models;

create view v_models as
select
  m.id,
  m.slug,
  m.name,
  m.is_deal,
  m.is_available,
  m.is_featured,
  m.price_min_m_ft,
  m.price_max_m_ft,
  m.length_mm,
  m.width_mm,
  m.height_mm,
  m.wheelbase_mm,
  m.trunk_l,
  m.seats,
  m.power_hp,
  m.battery_kwh,
  m.range_km,
  m.acceleration_s,
  m.consumption_text,
  m.charging_ac_kw,
  m.charging_dc_kw,
  m.charging_text,
  m.warranty_years,
  m.warranty_km,
  m.battery_warranty_years,
  m.battery_warranty_km,
  m.source_url,
  m.data_updated_at,
  m.updated_at,
  b.id            as brand_id,
  b.slug          as brand_slug,
  b.name          as brand_name,
  b.brand_tone    as brand_tone,
  b.hero_color    as brand_hero_color,
  b.importer_name as brand_importer_name,
  b.importer_addr as brand_importer_addr,
  b.importer_site as brand_importer_site,
  b.dealers_text  as brand_dealers_text,
  c.id            as category_id,
  c.slug          as category_slug,
  c.label_hu      as category,
  d.id            as drive_id,
  d.slug          as drive_slug,
  d.label_hu      as drive,
  d.short_code    as drive_code,
  m.segment,
  -- primary photo storage path if any
  (select mp.storage_path
     from model_photos mp
    where mp.model_id = m.id and mp.is_primary
    order by mp.sort_order asc
    limit 1) as primary_photo_path,
  -- engine option aggregates (max across variants, fallback to model value)
  coalesce(
    (select max(eo.range_km)    from model_engine_options eo where eo.model_id = m.id),
    m.range_km)    as range_km_max,
  coalesce(
    (select max(eo.power_hp)    from model_engine_options eo where eo.model_id = m.id),
    m.power_hp)    as power_hp_max,
  coalesce(
    (select max(eo.battery_kwh) from model_engine_options eo where eo.model_id = m.id),
    m.battery_kwh) as battery_kwh_max,
  coalesce(
    (select max(eo.trunk_l)     from model_engine_options eo where eo.model_id = m.id),
    m.trunk_l)     as trunk_l_max,
  coalesce(
    (select max(eo.seats)       from model_engine_options eo where eo.model_id = m.id),
    m.seats)       as seats_max,
  exists(select 1 from model_engine_options eo where eo.model_id = m.id) as has_engine_options
from models m
join brands     b on b.id = m.brand_id
join categories c on c.id = m.category_id
join drives     d on d.id = m.drive_id
where m.archived_at is null;

grant select on v_models to anon, authenticated;
