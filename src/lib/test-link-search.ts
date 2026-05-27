// server-only — web search logic for auto-finding Hungarian test links
import "server-only";
import {
  GOOGLE_CSE_API_KEY,
  GOOGLE_CSE_CX,
  HAS_GOOGLE_CSE,
  HAS_YOUTUBE,
  YOUTUBE_API_KEY,
} from "./env";

export type FoundLink = {
  url: string;
  title: string;
  source_name: string;
  kind: "article" | "video";
};

// ─── Hungarian auto-review sites we prioritise ────────────────────────────────
const HU_AUTO_SITES = [
  "vezess.hu",
  "totalcar.hu",
  "automotor.hu",
  "autonavigator.hu",
  "autósélet.hu",
  "villanyautosok.hu",
  "zoldauto.hu",
  "hipermotor.hu",
  "avtomobil.hu",
  "autohírek.hu",
];

// ─── Google Custom Search JSON API ───────────────────────────────────────────
async function googleSearch(query: string): Promise<FoundLink[]> {
  if (!HAS_GOOGLE_CSE) return [];
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", GOOGLE_CSE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_CX);
  url.searchParams.set("q", query);
  url.searchParams.set("lr", "lang_hu");        // Hungarian language results
  url.searchParams.set("gl", "hu");             // Hungarian region
  url.searchParams.set("num", "10");

  const res = await fetch(url.toString(), { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return [];

  const json = await res.json().catch(() => null);
  if (!json?.items) return [];

  return (json.items as Array<{ link: string; title: string; displayLink: string }>)
    .map((item) => ({
      url: item.link,
      title: item.title ?? "",
      source_name: item.displayLink ?? new URL(item.link).hostname,
      kind: "article" as const,
    }))
    .filter((r) => r.url.startsWith("http"));
}

// ─── YouTube Data API v3 ─────────────────────────────────────────────────────
async function youtubeSearch(query: string): Promise<FoundLink[]> {
  if (!HAS_YOUTUBE) return [];
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", YOUTUBE_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("relevanceLanguage", "hu");
  url.searchParams.set("maxResults", "8");

  const res = await fetch(url.toString(), { cache: "no-store" }).catch(() => null);
  if (!res?.ok) return [];

  const json = await res.json().catch(() => null);
  if (!json?.items) return [];

  return (
    json.items as Array<{
      id: { videoId: string };
      snippet: { title: string; channelTitle: string };
    }>
  )
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet?.title ?? "",
      source_name: "youtube.com",
      kind: "video" as const,
    }));
}

// ─── DuckDuckGo HTML fallback (no key needed) ─────────────────────────────────
// Parses the DuckDuckGo Lite HTML search result page.
// Works without API keys but is fragile — use as fallback only.
async function duckduckgoSearch(query: string): Promise<FoundLink[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}&kl=hu-hu`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; kinaiauto-bot/1.0; +https://www.kinaiauto.com)",
      Accept: "text/html",
    },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return [];

  const html = await res.text().catch(() => "");
  const results: FoundLink[] = [];

  // Extract result links from DuckDuckGo Lite HTML
  const linkRegex = /href="(https?:\/\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = linkRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    if (seen.has(rawUrl)) continue;
    // Filter to known Hungarian auto sites
    const isHuSite = HU_AUTO_SITES.some((s) => rawUrl.includes(s));
    if (!isHuSite) continue;
    seen.add(rawUrl);
    const host = (() => { try { return new URL(rawUrl).hostname.replace("www.", ""); } catch { return ""; } })();
    results.push({ url: rawUrl, title: host, source_name: host, kind: "article" });
    if (results.length >= 8) break;
  }
  return results;
}

// ─── Main: search for Hungarian test links for a model ───────────────────────
export async function searchTestLinks(
  brandName: string,
  modelName: string,
): Promise<FoundLink[]> {
  const baseQuery = `${brandName} ${modelName} teszt`;
  // Google CSE is already restricted to the configured sites — no site: operators needed
  const webQuery = baseQuery;
  // DuckDuckGo fallback searches the entire web, so site: filtering is still needed there
  const siteList = HU_AUTO_SITES.slice(0, 4).map((s) => `site:${s}`).join(" OR ");
  const ddgQuery = `${baseQuery} (${siteList})`;
  const ytQuery = `${baseQuery} magyar teszt vélemény`;

  const results: FoundLink[] = [];
  const seen = new Set<string>();

  function add(links: FoundLink[]) {
    for (const l of links) {
      const key = l.url.split("?")[0]; // deduplicate by base URL
      if (!seen.has(key)) {
        seen.add(key);
        results.push(l);
      }
    }
  }

  if (HAS_GOOGLE_CSE) {
    // Use Google CSE for web + YouTube
    const [webResults, ytResults] = await Promise.all([
      googleSearch(webQuery),
      youtubeSearch(ytQuery),
    ]);
    add(webResults);
    add(ytResults);
  } else {
    // Fallback: DuckDuckGo HTML scraping + YouTube
    const [ddgResults, ytResults] = await Promise.all([
      duckduckgoSearch(ddgQuery),
      youtubeSearch(ytQuery),
    ]);
    add(ddgResults);
    add(ytResults);
  }

  return results;
}
