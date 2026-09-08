// Centralized env access. Tolerates missing values at build time — at runtime
// the db / storage helpers surface clear errors.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.kinaiauto.com";

export const SITE_NAME = "kinaiauto.com";
export const SITE_LOCALE = "hu_HU";

// ----- Database & object storage -----
// Postgres (Coolify/Hetzner):    DATABASE_URL (read-write, CMS + public writes),
//                                DATABASE_URL_RO (read-only, public site), DATABASE_SSL
//                                → consumed in lib/db.ts
// S3-compatible object storage:  S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID,
//   (Hetzner Object Storage /    S3_SECRET_ACCESS_KEY, S3_FORCE_PATH_STYLE
//    MinIO)                      → consumed in lib/storage.ts
// Public media base (browser):   NEXT_PUBLIC_S3_PUBLIC_BASE → lib/media-urls.ts

// ----- Server-only env (CMS) -----

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

// Perplexity API — web-grounded research (used for "find new models").
// Server-only secret: do NOT prefix with NEXT_PUBLIC_, so it never reaches the
// browser. Set it in Vercel → Project → Settings → Environment Variables and in
// local .env.local. Get a key at: https://www.perplexity.ai/settings/api
export const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";
export const HAS_PERPLEXITY = Boolean(PERPLEXITY_API_KEY);

// Google Ads Conversion ID (e.g. AW-XXXXXXXXXX)
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "";
