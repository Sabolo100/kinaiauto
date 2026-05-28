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

// ----- Server-only env (CMS) -----
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";
export const HAS_SUPABASE_ADMIN = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

export const CMS_PASSWORD = process.env.CMS_PASSWORD || "";
export const CMS_SESSION_SECRET = process.env.CMS_SESSION_SECRET || "";

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const HAS_ANTHROPIC = Boolean(ANTHROPIC_API_KEY);
export const HAS_OPENAI = Boolean(OPENAI_API_KEY);

// Google Custom Search JSON API (kept for reference, no longer used)
export const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY || "";
export const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX || "";
export const HAS_GOOGLE_CSE = Boolean(GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX);

// Serper.dev — Google Search API, 2500 free queries/month
// Get free key at: https://serper.dev
export const SERPER_API_KEY = process.env.SERPER_API_KEY || "";
export const HAS_SERPER = Boolean(SERPER_API_KEY);

// YouTube Data API v3
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
export const HAS_YOUTUBE = Boolean(YOUTUBE_API_KEY);

// Google Ads Conversion ID (e.g. AW-XXXXXXXXXX)
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
