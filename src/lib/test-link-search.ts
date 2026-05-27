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

export type SearchDebug = {
  hasGoogleCse: boolean;
  hasYoutube: boolean;
  webQuery: string;
  ytQuery: string;
  googleRaw?: unknown;
  googleError?: string;
  youtubeRaw?: unknown;
  youtubeError?: string;
  results: FoundLink[];
};

// ─── Hungarian auto-review sites ─────────────────────────────────────────────
const HU_AUTO_SITES = [
  "vezess.hu",
  "totalcar.hu",
  "automotor.hu",
  "autonavigator.hu",
  "villanyautosok.hu",
  "zoldauto.hu",
  "hipermotor.hu",
];

// ─── Google Custom Search JSON API ───────────────────────────────────────────
async function googleSearch(
  query: string,
): Promise<{ results: FoundLink[]; raw?: unknown; error?: string }> {
  if (!HAS_GOOGLE_CSE) return { results: [], error: "Google CSE not configured" };

  const url = new URL("https://www.googleapis.com/customsearch/v1/siterestrict");
  url.searchParams.set("key", GOOGLE_CSE_API_KEY);
  url.searchParams.set("cx", GOOGLE_CSE_CX);
  url.searchParams.set("q", query);
  url.searchParams.set("lr", "lang_hu");
  url.searchParams.set("gl", "hu");
  url.searchParams.set("num", "10");

  let res: Response | null = null;
  try {
    res = await fetch(url.toString(), { cache: "no-store" });
  } catch (e) {
    return { results: [], error: `fetch failed: ${e}` };
  }

  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { results: [], error: `non-JSON response: ${text.slice(0, 200)}` }; }

  if (!res.ok) {
    return { results: [], raw: json, error: `HTTP ${res.status}: ${JSON.stringify(json)}` };
  }

  const data = json as { items?: Array<{ link: string; title: string; displayLink: string }> };
  if (!data.items?.length) return { results: [], raw: json, error: "no items in response" };

  const results: FoundLink[] = data.items
    .map((item) => ({
      url: item.link,
      title: item.title ?? "",
      source_name: (item.displayLink ?? "").replace("www.", "") || new URL(item.link).hostname.replace("www.", ""),
      kind: "article" as const,
    }))
    .filter((r) => r.url.startsWith("http"));

  return { results, raw: json };
}

// ─── YouTube Data API v3 ─────────────────────────────────────────────────────
async function youtubeSearch(
  query: string,
): Promise<{ results: FoundLink[]; raw?: unknown; error?: string }> {
  if (!HAS_YOUTUBE) return { results: [], error: "YouTube API not configured" };

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", YOUTUBE_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("relevanceLanguage", "hu");
  url.searchParams.set("maxResults", "8");

  let res: Response | null = null;
  try {
    res = await fetch(url.toString(), { cache: "no-store" });
  } catch (e) {
    return { results: [], error: `fetch failed: ${e}` };
  }

  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { results: [], error: `non-JSON response: ${text.slice(0, 200)}` }; }

  if (!res.ok) {
    return { results: [], raw: json, error: `HTTP ${res.status}: ${JSON.stringify(json)}` };
  }

  const data = json as {
    items?: Array<{ id: { videoId: string }; snippet: { title: string } }>;
  };
  if (!data.items?.length) return { results: [], raw: json, error: "no items in response" };

  const results: FoundLink[] = data.items
    .filter((item) => item.id?.videoId)
    .map((item) => ({
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet?.title ?? "",
      source_name: "youtube.com",
      kind: "video" as const,
    }));

  return { results, raw: json };
}

// ─── DuckDuckGo HTML fallback ─────────────────────────────────────────────────
async function duckduckgoSearch(query: string): Promise<{ results: FoundLink[]; error?: string }> {
  const encoded = encodeURIComponent(query);
  const fetchUrl = `https://html.duckduckgo.com/html/?q=${encoded}&kl=hu-hu`;
  let res: Response | null = null;
  try {
    res = await fetch(fetchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; kinaiauto-bot/1.0; +https://www.kinaiauto.com)",
        Accept: "text/html",
      },
      cache: "no-store",
    });
  } catch (e) {
    return { results: [], error: `fetch failed: ${e}` };
  }

  if (!res.ok) return { results: [], error: `HTTP ${res.status}` };

  const html = await res.text();
  const results: FoundLink[] = [];
  const linkRegex = /href="(https?:\/\/[^"]+)"/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = linkRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    if (seen.has(rawUrl)) continue;
    const isHuSite = HU_AUTO_SITES.some((s) => rawUrl.includes(s));
    if (!isHuSite) continue;
    seen.add(rawUrl);
    const host = (() => { try { return new URL(rawUrl).hostname.replace("www.", ""); } catch { return ""; } })();
    results.push({ url: rawUrl, title: host, source_name: host, kind: "article" });
    if (results.length >= 8) break;
  }
  return { results };
}

// ─── Main search (production use) ────────────────────────────────────────────
export async function searchTestLinks(
  brandName: string,
  modelName: string,
): Promise<FoundLink[]> {
  const { results } = await searchTestLinksDebug(brandName, modelName);
  return results;
}

// ─── Debug search (returns full API responses for diagnosis) ─────────────────
export async function searchTestLinksDebug(
  brandName: string,
  modelName: string,
): Promise<SearchDebug> {
  const baseQuery = `${brandName} ${modelName} teszt`;
  const webQuery = baseQuery; // CSE is already site-restricted
  const siteList = HU_AUTO_SITES.slice(0, 4).map((s) => `site:${s}`).join(" OR ");
  const ddgQuery = `${baseQuery} (${siteList})`;
  const ytQuery = `${brandName} ${modelName} teszt vélemény`;

  const debug: SearchDebug = {
    hasGoogleCse: HAS_GOOGLE_CSE,
    hasYoutube: HAS_YOUTUBE,
    webQuery,
    ytQuery,
    results: [],
  };

  const seen = new Set<string>();
  function add(links: FoundLink[]) {
    for (const l of links) {
      const key = l.url.split("?")[0];
      if (!seen.has(key)) { seen.add(key); debug.results.push(l); }
    }
  }

  if (HAS_GOOGLE_CSE) {
    const [webRes, ytRes] = await Promise.all([
      googleSearch(webQuery),
      youtubeSearch(ytQuery),
    ]);
    debug.googleRaw = webRes.raw;
    debug.googleError = webRes.error;
    debug.youtubeRaw = ytRes.raw;
    debug.youtubeError = ytRes.error;
    add(webRes.results);
    add(ytRes.results);
  } else {
    const [ddgRes, ytRes] = await Promise.all([
      duckduckgoSearch(ddgQuery),
      youtubeSearch(ytQuery),
    ]);
    debug.googleError = `CSE not configured — used DDG fallback${ddgRes.error ? ": " + ddgRes.error : ""}`;
    debug.youtubeRaw = ytRes.raw;
    debug.youtubeError = ytRes.error;
    add(ddgRes.results);
    add(ytRes.results);
  }

  return debug;
}
