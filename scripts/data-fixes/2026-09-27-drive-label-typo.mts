// Fix the drive label typo "Önttöltő hibrid" → "Öntöltő hibrid" (approved 2026-09-27).
// Idempotent: only rows whose value is exactly the old text are touched, so a
// second run (or a manual fix in the meantime) changes nothing. The slug
// ("onttolto-hibrid") is NOT changed — URLs and filters keep working.
//
//   npx tsx scripts/data-fixes/2026-09-27-drive-label-typo.mts          # dry run
//   npx tsx scripts/data-fixes/2026-09-27-drive-label-typo.mts --apply  # write
//
// Reads DATABASE_URL (read-write role) from the environment or .env.local.
import postgres from "postgres";
import { existsSync, readFileSync } from "node:fs";

const OLD = "Önttöltő hibrid";
const NEW = "Öntöltő hibrid";
const apply = process.argv.includes("--apply");

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const sql = postgres(process.env.DATABASE_URL, {
  ssl: (process.env.DATABASE_SSL || "require") === "disable" ? false : "require",
  max: 1,
});

// 1) The label itself.
const drives = await sql<{ id: number; slug: string; label_hu: string }[]>`
  select id, slug, label_hu from drives where label_hu = ${OLD}`;
console.log(`drives.label_hu = "${OLD}": ${drives.length} row(s)`, drives);

// 2) Free-text columns that may repeat the typo (report only — not rewritten).
const cols = await sql<{ table_name: string; column_name: string }[]>`
  select table_name, column_name from information_schema.columns
  where table_schema = 'public' and data_type in ('text', 'character varying')
    and table_name in (select table_name from information_schema.tables
                       where table_schema = 'public' and table_type = 'BASE TABLE')`;
for (const c of cols) {
  if (c.table_name === "drives" && c.column_name === "label_hu") continue;
  const [r] = await sql.unsafe<{ n: string }[]>(
    `select count(*)::text n from public."${c.table_name}" where "${c.column_name}" ilike '%önttöltő%'`,
  );
  if (r.n !== "0") console.log(`  also in ${c.table_name}.${c.column_name}: ${r.n} row(s) (not changed)`);
}

if (!apply) {
  console.log(`\nDry run. Re-run with --apply to set "${NEW}".`);
} else if (drives.length) {
  const res = await sql`update drives set label_hu = ${NEW} where label_hu = ${OLD} returning id, slug, label_hu`;
  console.log(`\nUpdated ${res.count} row(s):`, res);
} else {
  console.log("\nNothing to update (already fixed).");
}
await sql.end();
