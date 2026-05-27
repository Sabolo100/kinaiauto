// server-only — web search logic for auto-finding Hungarian test links
import "server-only";
import {
  HAS_SERPER,
  HAS_YOUTUBE,
  SERPER_API_KEY,
  YOUTUBE_API_KEY,
} from "./env";

export type FoundLink = {
  url: string;
  title: string;
  source_name: string;
  kind: "article" | "video";
};

export type SearchDebug = {
  hasSerper: boolean;
  hasYoutube: boolean;
  webQuery: string;
  ytQuery: string;
  serperRaw?: unknown;
  serperError?: string;
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

// ─── Serper.dev — Google Search API ──────────────────────────────────────────
async function serperSearch(
  query: string,
): Promise<{ results: FoundLink[]; raw?: unknown; error?: string }> {
  if (!HAS_SERPER) return { results: [], error: "Serper API not configured" };

  let res: Response | null = null;
  try {
    res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        gl: "hu",  // Hungary region
        hl: "hu",  // Hungarian language
        num: 10,
      }),
      cache: "no-store",
    });
  } catch (e) {
    return { results: [], error: `fetch failed: ${e}` };
  }

  const text = await res.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { return { results: [], error: `non-JSON: ${text.slice(0, 200)}` }; }

  if (!res.ok) {
    return { results: [], raw: json, error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  }

  const data = json as {
    organic?: Array<{ link: string; title: string; displayLink?: string }>;
  };

  if (!data.organic?.length) return { results: [], raw: json, error: "no organic results" };

  const results: FoundLink[] = data.organic
    .filter((item) => {
      // Keep only results from known Hungarian auto sites
      const url = item.link ?? "";
      return HU_AUTO_SITES.some((s) => url.includes(s));
    })
    .map((item) => {
      const host = (item.displayLink ?? "").replace("www.", "") ||
        (() => { try { return new URL(item.link).hostname.replace("www.", ""); } catch { return ""; } })();
      return {
        url: item.link,
        title: item.title ?? "",
        source_name: host,
        kind: "article" as const,
      };
    });

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
  try { json = JSON.parse(text); } catch { return { results: [], error: `non-JSON: ${text.slice(0, 200)}` }; }

  if (!res.ok) {
    return { results: [], raw: json, error: `HTTP ${res.status}: ${JSON.stringify(json)}` };
  }

  const data = json as {
    items?: Array<{ id: { videoId: string }; snippet: { title: string } }>;
  };
  if (!data.items?.length) return { results: [], raw: json, error: "no items" };

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

// ─── DuckDuckGo HTML fallback (no key needed) ─────────────────────────────────
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
    if (!HU_AUTO_SITES.some((s) => rawUrl.includes(s))) continue;
    seen.add(rawUrl);
    const host = (() => { try { return new URL(rawUrl).hostname.replace("www.", ""); } catch { return ""; } })();
    results.push({ url: rawUrl, title: host, source_name: host, kind: "article" });
    if (results.length >= 8) break;
  }
  return { results };
}

// ─── Main search ──────────────────────────────────────────────────────────────
export async function searchTestLinks(
  brandName: string,
  modelName: string,
): Promise<FoundLink[]> {
  const { results } = await searchTestLinksDebug(brandName, modelName);
  return results;
}

// ─── Debug search ─────────────────────────────────────────────────────────────
export async function searchTestLinksDebug(
  brandName: string,
  modelName: string,
): Promise<SearchDebug> {
  const baseQuery = `${brandName} ${modelName} teszt`;
  const siteList = HU_AUTO_SITES.slice(0, 4).map((s) => `site:${s}`).join(" OR ");
  const webQuery = `${baseQuery} (${siteList})`;
  const ytQuery = `${brandName} ${modelName} teszt vélemény`;

  const debug: SearchDebug = {
    hasSerper: HAS_SERPER,
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

  // Web: Serper.dev if available, DuckDuckGo fallback
  if (HAS_SERPER) {
    const serperRes = await serperSearch(webQuery);
    debug.serperRaw = serperRes.raw;
    debug.serperError = serperRes.error;
    add(serperRes.results);
  } else {
    const ddgRes = await duckduckgoSearch(webQuery);
    debug.serperError = `Serper not configured — used DDG fallback${ddgRes.error ? ": " + ddgRes.error : ""}`;
    add(ddgRes.results);
  }

  // Videos: YouTube
  const ytRes = await youtubeSearch(ytQuery);
  debug.youtubeRaw = ytRes.raw;
  debug.youtubeError = ytRes.error;
  add(ytRes.results);

  return debug;
}
