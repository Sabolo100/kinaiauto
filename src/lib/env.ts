// Centralized env access. Tolerates missing values at build time — at runtime
// the Supabase client fall-through will surface clear errors.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.kinaiauto.com";

export const SITE_NAME = "kinaiauto.com";
export const SITE_LOCALE = "hu_HU";

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const STORAGE_PUBLIC_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public`
  : "";
