-- =====================================================================
-- Migration: model_engine_options — modellváltozat (engine variant) tábla
-- Run once in the Supabase SQL Editor.
--
-- Background: egy modellnek (BYD Surf 2) több hajtáslánc-változata is
-- lehet (Alap 400 km / Long Range 600 km). Eddig csak a model szintjén
-- volt egyetlen range_km/power_hp/battery_kwh érték, ami megtévesztő.
-- Ez a tábla TÁROLJA a változatonkénti adatokat (opcionálisan). Ha nincs
-- változat a modellhez, a model-szintű mezők maradnak az aktívak.
-- =====================================================================

create table if not exists model_engine_options (
  id               uuid primary key default gen_random_uuid(),
  model_id         uuid not null references models(id) on delete cascade,
  name             text not null default 'Base',
  range_km         integer,
  power_hp         integer,
  battery_kwh      numeric(5,2),
  trunk_l          integer,
  seats            smallint,
  consumption_text text,
  sort_order       smallint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists ix_model_engine_options_model
  on model_engine_options(model_id, sort_order);

alter table model_engine_options enable row level security;

-- Public read (anyone can read, just like models)
drop policy if exists "public read engine options" on model_engine_options;
create policy "public read engine options"
  on model_engine_options for select to anon, authenticated
  using (true);

-- Service role full access (CMS írás)
drop policy if exists "service role full access engine options" on model_engine_options;
create policy "service role full access engine options"
  on model_engine_options for all to service_role
  using (true) with check (true);

grant select on model_engine_options to anon, authenticated;
