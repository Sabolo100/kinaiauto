-- App roles replacing Supabase RLS: run against the NEW database.
-- Passwords are injected by 04-restore.sh via psql variables :ro_pw / :rw_pw
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kinaiauto_ro') THEN CREATE ROLE kinaiauto_ro LOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'kinaiauto_rw') THEN CREATE ROLE kinaiauto_rw LOGIN; END IF;
END $$;
ALTER ROLE kinaiauto_ro PASSWORD :'ro_pw';
ALTER ROLE kinaiauto_rw PASSWORD :'rw_pw';

GRANT CONNECT ON DATABASE :"dbname" TO kinaiauto_ro, kinaiauto_rw;
GRANT USAGE ON SCHEMA public TO kinaiauto_ro, kinaiauto_rw;

-- RW: everything the CMS + public writers need
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO kinaiauto_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO kinaiauto_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kinaiauto_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO kinaiauto_rw;

-- RO: only what the PUBLIC site reads (mirrors the old anon RLS policies).
-- Deliberately EXCLUDES site_settings (holds resend_api_key), quote_*,
-- site_events, model_extractions, *_jobs, discovered_models, unapproved links.
GRANT SELECT ON categories, drives, price_bands, brands, models, model_trims,
  model_engine_options, model_photos, brand_logos, dealers, dealer_contacts,
  kb_categories, articles, kb_pages, faqs, model_test_links,
  v_models, v_brand_summary, v_data_freshness
  TO kinaiauto_ro;
