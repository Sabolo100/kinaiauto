// Server-only Postgres access (postgres.js).
//
// Two connections mirror the old anon / service-role split:
//   • sqlRo — read-only role  (public site: SELECT on public tables + views)
//   • sql   — read-write role (CMS routes + public writes: quote_requests, site_events)
// If DATABASE_URL_RO is not set, the public site falls back to the RW URL so
// nothing silently breaks — set it in production for least privilege.
//
// Vercel serverless → Hetzner Postgres crosses the public internet, so TLS is
// on by default (DATABASE_SSL=require). Pools are tiny: each warm function
// instance keeps at most `max` connections open.
import "server-only";
import postgres, { type Sql } from "postgres";

const RW_URL = process.env.DATABASE_URL || "";
const RO_URL = process.env.DATABASE_URL_RO || RW_URL;

export const HAS_DB = Boolean(RW_URL);

function sslOption(): false | "require" | "prefer" | "verify-full" {
  const v = (process.env.DATABASE_SSL || "require").toLowerCase();
  if (v === "false" || v === "disable" || v === "0") return false;
  if (v === "prefer" || v === "verify-full") return v;
  return "require"; // encrypt in transit; accepts the self-signed cert Coolify issues
}

function make(url: string): Sql {
  return postgres(url, {
    ssl: sslOption(),
    max: Number(process.env.DATABASE_POOL_MAX || 3),
    idle_timeout: 20,
    connect_timeout: 10,
    // Named prepared statements misbehave behind transaction poolers; off is safest.
    prepare: false,
    transform: { undefined: null },
    // Match the JSON shapes the app historically received over PostgREST:
    //  • numeric(6,2) / int8 came back as NUMBERS (postgres.js default = string,
    //    which would silently break price/battery math via string comparison)
    //  • date/timestamp came back as ISO STRINGS (code does `.slice(0,10)`;
    //    a JS Date would crash there) — keep them raw.
    types: {
      numeric: { to: 1700, from: [1700], serialize: (x: number) => String(x), parse: (x: string) => parseFloat(x) },
      int8:    { to: 20,   from: [20],   serialize: (x: number) => String(x), parse: (x: string) => Number(x) },
      rawdate: { to: 1184, from: [1082, 1114, 1184], serialize: (x: string) => x, parse: (x: string) => x },
    },
  });
}

// Module-level singletons survive warm invocations on Vercel.
export const sql: Sql | null = RW_URL ? make(RW_URL) : null;
export const sqlRo: Sql | null = RO_URL ? make(RO_URL) : null;

/** Read-write handle. Throws a clear error when DATABASE_URL is missing. */
export function db(): Sql {
  if (!sql) {
    throw new Error("Database not configured. Set DATABASE_URL in .env.local / Vercel.");
  }
  return sql;
}

/** Read-only handle for the public site (falls back to RW if RO not set). */
export function dbRo(): Sql {
  return sqlRo ?? db();
}

// ─── Small, injection-safe CRUD helpers for the many single-table call sites ──
// postgres.js `sql(table)` quotes identifiers and `sql(object)` builds
// `(cols) values (...)` / `set col = $1, ...` fragments safely.

export type Row = Record<string, unknown>;

/** INSERT one row, return it. */
export async function insertOne<T extends Row = Row>(table: string, row: Row): Promise<T> {
  const s = db();
  const [out] = await s<T[]>`insert into ${s(table)} ${s(row)} returning *`;
  return out;
}

/** INSERT many rows (no-op on empty), return them. */
export async function insertMany<T extends Row = Row>(table: string, rows: Row[]): Promise<T[]> {
  if (rows.length === 0) return [];
  const s = db();
  return s<T[]>`insert into ${s(table)} ${s(rows)} returning *`;
}

/** UPDATE by primary key `id`, return the row (or null if not found). */
export async function updateById<T extends Row = Row>(
  table: string,
  id: string | number,
  patch: Row,
): Promise<T | null> {
  const keys = Object.keys(patch);
  if (keys.length === 0) {
    const s = db();
    const [row] = await s<T[]>`select * from ${s(table)} where id = ${id}`;
    return row ?? null;
  }
  const s = db();
  const [row] = await s<T[]>`update ${s(table)} set ${s(patch)} where id = ${id} returning *`;
  return row ?? null;
}

/** DELETE by primary key `id`. Returns number of rows removed. */
export async function deleteById(table: string, id: string | number): Promise<number> {
  const s = db();
  const res = await s`delete from ${s(table)} where id = ${id}`;
  return res.count;
}

/** SELECT * by primary key. */
export async function findById<T extends Row = Row>(
  table: string,
  id: string | number,
  ro = false,
): Promise<T | null> {
  const s = ro ? dbRo() : db();
  const [row] = await s<T[]>`select * from ${s(table)} where id = ${id}`;
  return row ?? null;
}

/** Fast unfiltered `count(*)`. Filtered counts are hand-written at call sites. */
export async function countRows(table: string): Promise<number> {
  const s = db();
  const [r] = await s<{ n: number }[]>`select count(*)::int as n from ${s(table)}`;
  return r?.n ?? 0;
}
