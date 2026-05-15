import { supabaseAdmin } from "./supabase-admin";

/**
 * Read a key from `site_settings`. Uses the service-role client because
 * site_settings has no public-read policy (settings may contain secrets like
 * resend_api_key).
 *
 * Falls back to `fallback` if the key is missing or the table is unreachable.
 */
export async function getSetting(
  key: string,
  fallback = "",
): Promise<string> {
  try {
    const sa = supabaseAdmin();
    const { data, error } = await sa
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value ?? fallback;
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
  try {
    const sa = supabaseAdmin();
    const { data, error } = await sa
      .from("site_settings")
      .select("key, value")
      .in("key", keys);
    if (error || !data) {
      // Return all fallbacks
      const result: Record<string, string> = {};
      for (const k of keys) result[k] = fallbacks[k] ?? "";
      return result;
    }
    const map = new Map(data.map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]));
    const result: Record<string, string> = {};
    for (const k of keys) result[k] = map.get(k) ?? fallbacks[k] ?? "";
    return result;
  } catch {
    const result: Record<string, string> = {};
    for (const k of keys) result[k] = fallbacks[k] ?? "";
    return result;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  const sa = supabaseAdmin();
  const { error } = await sa
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}
