-- Migration: add AI verification columns to model_test_links
-- Run once in Supabase SQL Editor

alter table model_test_links
  add column if not exists ai_ok      boolean,   -- null = not checked (manual), true = AI verified, false = AI rejected
  add column if not exists ai_summary text;      -- short reason from Claude ("cím alapján egyezik", etc.)
