// server-only — web search logic for auto-finding Hungarian test links
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_API_KEY,
  HAS_ANTHROPIC,
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
  /** Raw text snippet used for AI verification (article body excerpt or YT description) */
  snippet?: string;
};

export type VerifiedFoundLink = FoundLink & {
  ai_ok: boolean;
  ai_summary: string;
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

// ─── Article body extractor ───────────────────────────────────────────────────
/**
 * Fetches a URL and extracts readable text from heading + paragraph tags.
 * Returns at most 3000 chars. Returns "" on any error.
 */
async function fetchArticleSnippet(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "hu-HU,hu;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();

    // Strip scripts and styles
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");

    // Extract text from meaningful tags
    const parts: string[] = [];
    const tagRe = /<(title|h[1-4]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(stripped)) !== null) {
      const text = m[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/&[a-z#0-9]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 15) parts.push(text);
      if (parts.join(" ").length > 3000) break;
    }
    return parts.join(" ").slice(0, 3000);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

// ─── Claude Haiku relevance check ────────────────────────────────────────────
/**
 * Asks Claude Haiku whether a link is specifically about the given brand+model.
 * Falls back to simple keyword match when ANTHROPIC_API_KEY is not set.
 */
async function verifyLinkRelevance(
  brand: string,
  model: string,
  title: string,
  snippet: string,
  kind: "article" | "video",
): Promise<{ ok: boolean; summary: string }> {
  // ── Keyword fallback ──
  if (!HAS_ANTHROPIC) {
    const text = `${title} ${snippet}`.toLowerCase();
    const words = model.toLowerCase().split(/\s+/).filter(Boolean);
    const allFound = words.every((w) => text.includes(w));
    return {
      ok: allFound,
      summary: allFound ? "kulcsszó-egyezés" : "modell neve nem szerepel",
    };
  }

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const contentLabel = kind === "video" ? "YouTube videó" : "cikk";

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 120,
      messages: [
        {
          role: "user",
          content: `Autóipari tartalomszűrő feladat.

Keresett modell: ${brand} ${model}

${contentLabel} cím: ${title}
Szövegrészlet: ${snippet.slice(0, 1800) || "(nem elérhető)"}

Kérdés: Ez a tartalom kifejezetten a „${brand} ${model}" modellről szól (teszt, bemutató, hosszútáv, vélemény)?

Szabályok:
- Ha más változatot jelöl (pl. „${model} DMi" vs „${model}", vagy „${model}e" vs „${model}"), az HAMIS.
- Ha a cikk több modellt hasonlít össze és a ${model} csak mellékszereplő, az HAMIS.
- Ha a tartalom ártáblázat, specifikáció, reklám (nem újságírói teszt/vélemény), az HAMIS.

Válasz KIZÁRÓLAG JSON formában, más szöveg nélkül:
{"ok":true,"reason":"max 10 szavas indoklás magyarul"}`,
        },
      ],
    });

    const raw = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return { ok: false, summary: "AI: nem értelmezhető válasz" };
    const parsed = JSON.parse(jsonMatch[0]) as { ok: boolean; reason?: string };
    return {
      ok: Boolean(parsed.ok),
      summary: parsed.reason ?? (parsed.ok ? "releváns" : "nem releváns"),
    };
  } catch {
    return { ok: false, summary: "AI: ellenőrzés sikertelen" };
  }
}

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
        gl: "hu",
        hl: "hu",
        num: 10,
      }),
      cache: "no-store",
    });
  } catch (e) {
    return { results: [], error: `fetch failed: ${e}` };
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { results: [], error: `non-JSON: ${text.slice(0, 200)}` };
  }

  if (!res.ok) {
    return {
      results: [],
      raw: json,
      error: `HTTP ${res.status}: ${text.slice(0, 300)}`,
    };
  }

  const data = json as {
    organic?: Array<{ link: string; title: string; displayLink?: string }>;
  };

  if (!data.organic?.length)
    return { results: [], raw: json, error: "no organic results" };

  const results: FoundLink[] = data.organic
    .filter((item) => {
      const url = item.link ?? "";
      return HU_AUTO_SITES.some((s) => url.includes(s));
    })
    .map((item) => {
      const host =
        (item.displayLink ?? "").replace("www.", "") ||
        (() => {
          try {
            return new URL(item.link).hostname.replace("www.", "");
          } catch {
            return "";
          }
        })();
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

  // Step 1: Search for videos
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
  searchUrl.searchParams.set("q", query);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("relevanceLanguage", "hu");
  searchUrl.searchParams.set("maxResults", "8");

  let res: Response | null = null;
  try {
    res = await fetch(searchUrl.toString(), { cache: "no-store" });
  } catch (e) {
    return { results: [], error: `fetch failed: ${e}` };
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { results: [], error: `non-JSON: ${text.slice(0, 200)}` };
  }

  if (!res.ok) {
    return {
      results: [],
      raw: json,
      error: `HTTP ${res.status}: ${JSON.stringify(json)}`,
    };
  }

  const data = json as {
    items?: Array<{
      id: { videoId: string };
      snippet: { title: string; description?: string };
    }>;
  };
  if (!data.items?.length) return { results: [], raw: json, error: "no items" };

  const validItems = data.items.filter((item) => item.id?.videoId);

  // Step 2: Fetch full descriptions via videos.list (one extra API call)
  const descriptions: Record<string, string> = {};
  if (validItems.length > 0) {
    try {
      const ids = validItems.map((i) => i.id.videoId).join(",");
      const detailUrl = new URL(
        "https://www.googleapis.com/youtube/v3/videos",
      );
      detailUrl.searchParams.set("key", YOUTUBE_API_KEY);
      detailUrl.searchParams.set("id", ids);
      detailUrl.searchParams.set("part", "snippet");
      const detailRes = await fetch(detailUrl.toString(), {
        cache: "no-store",
      });
      if (detailRes.ok) {
        const detailData = (await detailRes.json()) as {
          items?: Array<{
            id: string;
            snippet: { description?: string };
          }>;
        };
        for (const item of detailData.items ?? []) {
          descriptions[item.id] = item.snippet?.description ?? "";
        }
      }
    } catch {}
  }

  const results: FoundLink[] = validItems.map((item) => ({
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    title: item.snippet?.title ?? "",
    source_name: "youtube.com",
    kind: "video" as const,
    snippet:
      descriptions[item.id.videoId] ||
      item.snippet?.description ||
      "",
  }));

  return { results, raw: json };
}

// ─── DuckDuckGo HTML fallback (no key needed) ─────────────────────────────────
async function duckduckgoSearch(
  query: string,
): Promise<{ results: FoundLink[]; error?: string }> {
  const encoded = encodeURIComponent(query);
  const fetchUrl = `https://html.duckduckgo.com/html/?q=${encoded}&kl=hu-hu`;
  let res: Response | null = null;
  try {
    res = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; kinaiauto-bot/1.0; +https://www.kinaiauto.com)",
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
    const host = (() => {
      try {
        return new URL(rawUrl).hostname.replace("www.", "");
      } catch {
        return "";
      }
    })();
    results.push({
      url: rawUrl,
      title: host,
      source_name: host,
      kind: "article",
    });
    if (results.length >= 8) break;
  }
  return { results };
}

// ─── Raw search (unverified, used by debug endpoint) ─────────────────────────
export async function searchTestLinks(
  brandName: string,
  modelName: string,
): Promise<FoundLink[]> {
  const { results } = await searchTestLinksDebug(brandName, modelName);
  return results;
}

// ─── Verified search ──────────────────────────────────────────────────────────
/**
 * Searches for test links, then fetches article body / YouTube full description,
 * and verifies each result with Claude Haiku.
 * Returns ONLY links confirmed to be about the given model.
 */
export async function searchTestLinksVerified(
  brandName: string,
  modelName: string,
): Promise<VerifiedFoundLink[]> {
  const rawLinks = await searchTestLinks(brandName, modelName);
  if (rawLinks.length === 0) return [];

  // Fetch article snippets in parallel (each has its own 6s timeout)
  const snippetResults = await Promise.allSettled(
    rawLinks.map(async (link) => {
      if (link.kind === "article") {
        return await fetchArticleSnippet(link.url);
      }
      // Videos: already have description from youtubeSearch()
      return link.snippet ?? "";
    }),
  );

  // Verify all links with Claude in parallel
  const verifyResults = await Promise.allSettled(
    rawLinks.map(async (link, i) => {
      const snippet =
        snippetResults[i].status === "fulfilled"
          ? snippetResults[i].value
          : "";
      return await verifyLinkRelevance(
        brandName,
        modelName,
        link.title,
        snippet,
        link.kind,
      );
    }),
  );

  const verified: VerifiedFoundLink[] = [];
  for (let i = 0; i < rawLinks.length; i++) {
    const result = verifyResults[i];
    const verdict =
      result.status === "fulfilled"
        ? result.value
        : { ok: false, summary: "ellenőrzés sikertelen" };
    if (verdict.ok) {
      verified.push({
        ...rawLinks[i],
        ai_ok: true,
        ai_summary: verdict.summary,
      });
    }
  }
  return verified;
}

// ─── Debug search ─────────────────────────────────────────────────────────────
export async function searchTestLinksDebug(
  brandName: string,
  modelName: string,
): Promise<SearchDebug> {
  const baseQuery = `${brandName} ${modelName} teszt`;
  const siteList = HU_AUTO_SITES.slice(0, 4)
    .map((s) => `site:${s}`)
    .join(" OR ");
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
      if (!seen.has(key)) {
        seen.add(key);
        debug.results.push(l);
      }
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
