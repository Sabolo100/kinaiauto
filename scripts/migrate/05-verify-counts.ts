// Compare row counts per table: Supabase (source) vs new Postgres (target).
// Exit 1 on any mismatch so nothing gets cut over on incomplete data.
//   npx tsx scripts/migrate/05-verify-counts.ts
import postgres from "postgres";
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env.migrate", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const src = postgres(process.env.SUPABASE_DB_URL!, { ssl: "require", max: 1 });
const dst = postgres(process.env.NEW_DB_URL!, { ssl: "require", max: 1 });

const tables = (await src<{ t: string }[]>`
  select tablename as t from pg_tables where schemaname='public' order by 1`).map((r) => r.t);

let bad = 0;
console.log(`${"table".padEnd(30)} ${"supabase".padStart(10)} ${"new".padStart(10)}  status`);
for (const t of tables) {
  const [a] = await src.unsafe<{ n: string }[]>(`select count(*)::text n from public."${t}"`);
  const [b] = await dst.unsafe<{ n: string }[]>(`select count(*)::text n from public."${t}"`).catch(() => [{ n: "MISSING" }]);
  const ok = a.n === b.n;
  if (!ok) bad++;
  console.log(`${t.padEnd(30)} ${a.n.padStart(10)} ${String(b.n).padStart(10)}  ${ok ? "✓" : "✗ MISMATCH"}`);
}
await src.end(); await dst.end();
console.log(bad ? `\n✗ ${bad} table(s) differ — DO NOT cut over.` : "\n✓ all tables match.");
process.exit(bad ? 1 : 0);
