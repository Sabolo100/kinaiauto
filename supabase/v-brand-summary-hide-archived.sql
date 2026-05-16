-- =====================================================================
-- Migration: hide archived models from v_brand_summary and v_data_freshness
-- Run once in the Supabase SQL Editor.
--
-- Background: v_brand_summary joinolja a models táblát, de nem szűri ki
-- az archivált (soft-deleted) sorokat. Emiatt a márkaoldalon a modellek
-- számlálója, a kategória- és hajtásmód-listák tartalmazhatnak archivált
-- modelleket. Ugyanez a probléma fennáll a v_data_freshness view-ban is,
-- ahol az archivált modell data_updated_at-ja befolyásolhatja a topbar
-- "Frissítve" pill megjelenített dátumát.
--
-- Miért DROP + CREATE és nem CREATE OR REPLACE?
-- A cms-schema.sql hozzáadta az archived_at oszlopot a brands táblához.
-- Emiatt a b.* most tartalmazza azt az oszlopot, ami eltolódást okoz
-- a live view meglévő oszlopsorrendjéhez képest — CREATE OR REPLACE VIEW
-- ilyen esetben hibával leáll. A DROP + CREATE biztonságos, mert nincs
-- más view vagy objektum, ami v_brand_summary-tól függne.
-- =====================================================================

-- v_brand_summary: modellek száma, ár-range, hajtásmódok, kategóriák
drop view if exists v_brand_summary cascade;
create view v_brand_summary as
select
  b.*,
  count(m.id)::int as models_count,
  min(m.price_min_m_ft) as min_price_m_ft,
  max(m.price_max_m_ft) as max_price_m_ft,
  array(
    select distinct d.label_hu
      from models m2
      join drives d on d.id = m2.drive_id
     where m2.brand_id = b.id
       and m2.archived_at is null
     order by d.label_hu
  ) as drives,
  array(
    select distinct c.label_hu
      from models m2
      join categories c on c.id = m2.category_id
     where m2.brand_id = b.id
       and m2.archived_at is null
     order by c.label_hu
  ) as categories
from brands b
left join models m on m.brand_id = b.id and m.is_available and m.archived_at is null
group by b.id;

grant select on v_brand_summary to anon, authenticated;

-- v_data_freshness: csak nem archivált modellek alapján számolja a legutóbbi frissítést
drop view if exists v_data_freshness cascade;
create view v_data_freshness as
select max(coalesce(m.data_updated_at, m.updated_at::date)) as last_updated_at
from models m
where m.archived_at is null;

grant select on v_data_freshness to anon, authenticated;
