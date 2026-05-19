-- Migration: add charging and acceleration columns to model_engine_options
alter table model_engine_options
  add column if not exists charging_ac_kw numeric(5,2),
  add column if not exists charging_dc_kw  numeric(6,2),
  add column if not exists charging_text   text,
  add column if not exists acceleration_s  numeric(4,2);
