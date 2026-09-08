import { db } from "./db";

/**
 * Read a key from `site_settings`. Uses the read-write connection because
 * site_settings has no public read grant (settings may contain secrets like
 * resend_api_key) — only the RW role can see it.
 *
 * Falls back to `fallback` if the key is missing or the table is unreachable.
 */
export async function getSetting(
  key: string,
  fallback = "",
): Promise<string> {
  try {
    const sql = db();
    const [row] = await sql<{ value: string | null }[]>`
      select value from site_settings where key = ${key} limit 1`;
    if (!row) return fallback;
    return row.value ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Read several keys at once. Missing keys come back as their fallback.
 */
export async function getSettings(
  keys: string[],
  fallbacks: Record<string, string> = {},
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  try {
    const sql = db();
    const rows = keys.length
      ? await sql<{ key: string; value: string | null }[]>`
          select key, value from site_settings where key = any(${keys})`
      : [];
    const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));
    for (const k of keys) result[k] = map.get(k) ?? fallbacks[k] ?? "";
  } catch {
    for (const k of keys) result[k] = fallbacks[k] ?? "";
  }
  return result;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const sql = db();
  await sql`
    insert into site_settings (key, value, updated_at)
    values (${key}, ${value}, now())
    on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at`;
}
