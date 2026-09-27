import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/env";

// A robot that has its own User-Agent group ignores the `*` group entirely,
// so the disallow list is repeated in every group.
// The CMS path is deliberately NOT listed here (it would advertise it); it is
// kept out of the index with an X-Robots-Tag header (next.config.ts) + meta.
const DISALLOW = ["/api/"];

// Search engines and AI answer engines (search / user-triggered fetch).
const SEARCH_AND_ANSWER_BOTS = [
  "Googlebot",
  "Bingbot",
  "Applebot",
  "DuckDuckBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "DuckAssistBot",
  "MistralAI-User",
];

// Model-training crawlers. Allowed today (owner decision: the site is public,
// informational content). Change here if that decision changes.
const TRAINING_BOTS = [
  "GPTBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "anthropic-ai",
  "Claude-Web",
  "Bytespider",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: SEARCH_AND_ANSWER_BOTS, allow: "/", disallow: DISALLOW },
      { userAgent: TRAINING_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
