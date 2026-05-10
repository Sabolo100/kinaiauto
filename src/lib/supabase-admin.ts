// Server-only Supabase client with service role key. Bypasses RLS.
// NEVER import this from a Client Component. Use only in:
//   - API routes (route handlers)
//   - Server Actions
//   - Server Components inside the /c4m5s6 CMS namespace

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  HAS_SUPABASE_ADMIN,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "./env";

let _client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!HAS_SUPABASE_ADMIN) {
    throw new Error(
      "Supabase admin not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
    });
  }
  return _client;
}
