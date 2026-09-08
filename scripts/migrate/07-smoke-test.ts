// Smoke-test the migrated database with the SAME key queries the app runs.
// READ-ONLY (the one jsonb write runs inside a transaction that is rolled back).
//   npx tsx scripts/migrate/07-smoke-test.ts
// Uses DATABASE_URL (from env / .env.local) or NEW_DB_URL (from .env.migrate).
import postgres from "postgres";
import { existsSync, readFileSync } from "node:fs";

for (const f of [".env.local", ".env.migrate"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.DATABASE_URL || process.env.NEW_DB_URL;
if (!url) { console.error("set DATABASE_URL (or NEW_DB_URL in .env.migrate)"); process.exit(2); }
const sslEnv = (process.env.DATABASE_SSL || "require").toLowerCase();
const ssl = sslEnv === "false" || sslEnv === "disable" ? false : (sslEnv as "require" | "prefer" | "verify-full");

// Same parsers as src/lib/db.ts — so we test the REAL runtime shapes.
const sql = postgres(url, {
  ssl, max: 1, prepare: false,
  types: {
    numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => parseFloat(x) },
    int8:    { to: 20,   from: [20],   serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
    rawdate: { to: 1184, from: [1082, 1114, 1184], serialize: (x: string) => x, parse: (x: string) => x },
  },
});

type Check = { name: string; run: () => Promise<string> };
const checks: Check[] = [
  { name: "extensions present", run: async () => {
      const r = await sql<{ extname: string }[]>`select extname from pg_extension where extname in ('uuid-ossp','citext','pg_trgm')`;
      const have = r.map((x) => x.extname).sort().join(","); if (r.length < 3) throw new Error(`only: ${have}`); return have; } },
  { name: "3 views exist", run: async () => {
      const r = await sql<{ table_name: string }[]>`select table_name from information_schema.views where table_schema='public'`;
      const names = r.map((x) => x.table_name); for (const v of ["v_models","v_brand_summary","v_data_freshness"]) if (!names.includes(v)) throw new Error(`missing ${v}`); return names.join(","); } },
  { name: "v_models (public catalog)", run: async () => { const r = await sql`select * from v_models`; return `${r.length} rows`; } },
  { name: "numeric → number (price)", run: async () => {
      const [r] = await sql<{ p: unknown }[]>`select price_min_m_ft as p from models where price_min_m_ft is not null limit 1`;
      if (r && typeof r.p !== "number") throw new Error(`got ${typeof r.p}`); return r ? `typeof=${typeof r.p}` : "no priced model (ok)"; } },
  { name: "date → raw string (updated_at)", run: async () => {
      const [r] = await sql<{ u: unknown }[]>`select updated_at as u from models limit 1`;
      if (r && typeof r.u !== "string") throw new Error(`got ${typeof r.u}`); return r ? `typeof=${typeof r.u}` : "no rows"; } },
  { name: "v_data_freshness", run: async () => { const [r] = await sql<{ last_updated_at: unknown }[]>`select last_updated_at from v_data_freshness limit 1`; return String(r?.last_updated_at); } },
  { name: "brands active + primary logos", run: async () => {
      const b = await sql`select * from brands where is_active order by sort_order`;
      const l = await sql`select brand_id, storage_path from brand_logos where variant='primary'`; return `${b.length} brands, ${l.length} logos`; } },
  { name: "dealers + contacts json_agg embed", run: async () => {
      const r = await sql<{ contacts: unknown }[]>`
        select d.*, coalesce((select json_agg(c order by c.sort_order) from dealer_contacts c where c.dealer_id = d.id), '[]'::json) as contacts
        from dealers d where d.is_active order by d.sort_order`;
      if (r.length && !Array.isArray(r[0].contacts)) throw new Error("contacts not an array"); return `${r.length} dealers`; } },
  { name: "photos by model (any)", run: async () => { const r = await sql`select id, model_id, storage_path, is_primary, kind, sort_order from model_photos order by sort_order`; return `${r.length} photos`; } },
  { name: "engine options", run: async () => { const r = await sql`select * from model_engine_options order by model_id, sort_order`; return `${r.length} variants`; } },
  { name: "site_settings (rw-only table)", run: async () => { const r = await sql`select key from site_settings`; return `${r.length} keys`; } },
  { name: "CMS models list (3 embeds)", run: async () => {
      const r = await sql<{ brand: unknown; category: unknown; drive: unknown }[]>`
        select m.id, json_build_object('slug', b.slug, 'name', b.name) as brand,
               json_build_object('label_hu', c.label_hu) as category, json_build_object('label_hu', d.label_hu) as drive
        from models m left join brands b on b.id=m.brand_id left join categories c on c.id=m.category_id left join drives d on d.id=m.drive_id
        order by m.created_at desc`;
      if (r.length && typeof r[0].brand !== "object") throw new Error("brand embed not object"); return `${r.length} rows`; } },
  { name: "overview counts (int casts)", run: async () => {
      const [r] = await sql<{ brands: number; models: number; photos: number; pending: number }[]>`
        select (select count(*)::int from brands where archived_at is null) as brands,
               (select count(*)::int from models where archived_at is null) as models,
               (select count(*)::int from model_photos) as photos,
               (select count(*)::int from model_extractions where status='pending') as pending`;
      if (typeof r.brands !== "number") throw new Error("count not number"); return JSON.stringify(r); } },
  { name: "extract nested embed (to_jsonb ||)", run: async () => {
      const r = await sql`select e.id, case when m.id is null then null else to_jsonb(m) || jsonb_build_object('brand', case when b.id is null then null else jsonb_build_object('name', b.name, 'slug', b.slug) end) end as model
        from model_extractions e left join models m on m.id=e.model_id left join brands b on b.id=m.brand_id limit 5`; return `${r.length} rows (query ok)`; } },
  { name: "export join (brands!inner + arrays)", run: async () => {
      const r = await sql<{ photos: unknown }[]>`select m.id,
        coalesce((select json_agg(json_build_object('id', p.id)) from model_photos p where p.model_id=m.id), '[]'::json) as photos
        from models m join brands b on b.id=m.brand_id where m.archived_at is null`;
      if (r.length && !Array.isArray(r[0].photos)) throw new Error("photos not array"); return `${r.length} rows`; } },
  { name: "jsonb array write (::jsonb) — rolled back", run: async () => {
      let ok = false;
      await sql.begin(async (tx) => {
        const [j] = await tx<{ id: string; brand_ids: unknown }[]>`insert into model_discovery_jobs (status, brand_ids, progress, total_found)
          values ('pending', ${JSON.stringify(["a","b"])}::jsonb, '{}'::jsonb, 0) returning id, brand_ids`;
        ok = Array.isArray(j.brand_ids) && j.brand_ids.length === 2;
        throw new Error("ROLLBACK");   // never persist test rows
      }).catch((e: Error) => { if (e.message !== "ROLLBACK") throw e; });
      if (!ok) throw new Error("brand_ids did not round-trip as array"); return "insert+readback ok, rolled back"; } },
  { name: "jsonb via sql(obj) helper (pre-stringified) — rolled back", run: async () => {
      let ok = false;
      await sql.begin(async (tx) => {
        const [b] = await tx<{ id: string }[]>`select id from brands limit 1`;
        if (!b) { ok = true; return; } // empty DB → nothing to test
        const [d] = await tx<{ extra_emails: unknown }[]>`insert into dealers ${tx({
          brand_id: b.id, name: "__smoke__", city: "x", is_active: false, sort_order: 0,
          extra_emails: JSON.stringify(["a@x.hu", "b@x.hu"]), extra_phones: JSON.stringify([]),
        })} returning extra_emails`;
        ok = Array.isArray(d.extra_emails) && d.extra_emails.length === 2;
        throw new Error("ROLLBACK");
      }).catch((e: Error) => { if (e.message !== "ROLLBACK") throw e; });
      if (!ok) throw new Error("helper-path jsonb did not round-trip"); return "sql(obj) insert + readback ok, rolled back"; } },
  { name: "app roles exist", run: async () => {
      const r = await sql<{ rolname: string }[]>`select rolname from pg_roles where rolname in ('kinaiauto_ro','kinaiauto_rw')`;
      return r.length === 2 ? "kinaiauto_ro, kinaiauto_rw" : `WARN only ${r.map((x) => x.rolname).join(",") || "none"} (run 03-roles.sql)`; } },
];

let fail = 0;
for (const c of checks) {
  try { console.log(`✓ ${c.name.padEnd(40)} ${await c.run()}`); }
  catch (e) { fail++; console.log(`✗ ${c.name.padEnd(40)} ${(e as Error).message}`); }
}
await sql.end();
console.log(fail ? `\n✗ ${fail} check(s) failed` : "\n✓ all checks passed");
process.exit(fail ? 1 : 0);
