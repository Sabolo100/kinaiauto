import { createClient } from "@supabase/supabase-js";
import { HAS_SUPABASE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Singleton anon client used in Server Components.
// All queries use the public read-only RLS policies defined in supabase/schema.sql.
export const supabase = HAS_SUPABASE
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
      global: { fetch },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }
  return supabase;
}
