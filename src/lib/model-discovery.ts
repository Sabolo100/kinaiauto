// server-only — research logic for auto-discovering NEW car models that a brand
// has started (or is about to start) selling in Hungary but which are not yet in
// our `models` table.
//
// Two providers, tried in order:
//   1. Perplexity (sonar)  — web-grounded research with citations + recency filter.
//   2. Serper + Claude      — Google search results distilled by Claude Haiku.
// If neither key is configured, callers get a clear `provider: "none"` result.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  ANTHROPIC_API_KEY,
  HAS_ANTHROPIC,
  HAS_PERPLEXITY,
  HAS_SERPER,
  PERPLEXITY_API_KEY,
  SERPER_API_KEY,
} from "./env";

export type DiscoverySource = {
  url: string;
  title: string | null;
  date: string | null;
  kind: "official" | "news" | "other";
};

export type DiscoveredCandidate = {
  name: string;
  category_guess: string | null;
  drive_guess: string | null;
  reason: string | null;
  sources: DiscoverySource[];
  confidence: "high" | "medium" | "low";
};

export type DiscoveryResult = {
  provider: "perplexity" | "serper+claude" | "none";
  candidates: DiscoveredCandidate[];
  error?: string;
};

export type DiscoveryBrandInput = {
  name: string;
  importer_site: string | null; // e.g. "byd.com/hu"
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a model name for duplicate comparison: lowercase, strip accents and
 *  non-alphanumerics. "Atto 3" and "atto-3" both become "atto3". */
export function normalizeModelName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Strip protocol/path from a domain string → bare hostname. */
function cleanDomain(site: string): string {
  return site
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

/** Is this URL on the brand's official importer domain? */
function classifyKind(url: string, importerDomain: string | null): DiscoverySource["kind"] {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (importerDomain && host.includes(importerDomain)) return "official";
    // Common Hungarian auto-news / generic news hosts
    if (/vezess|totalcar|automotor|autonavigator|villanyautosok|zoldauto|hipermotor|az[eé]rt|hvg|index|portfolio|origo|24\.hu|telex|autopro|autoszektor/i.test(host))
      return "news";
    return "other";
  } catch {
    return "other";
  }
}

/** Keep only sources that are official pages OR news no older than `maxAgeDays`.
 *  Sources with an unknown date are kept (we can't prove they're stale). */
function filterRecentSources(sources: DiscoverySource[], maxAgeDays = 31): DiscoverySource[] {
  const cutoff = Date.now() - maxAgeDays * 86_400_000;
  return sources.filter((s) => {
    if (s.kind === "official") return true;
    if (!s.date) return true;
    const t = Date.parse(s.date);
    if (Number.isNaN(t)) return true;
    return t >= cutoff;
  });
}

/** Pull the first balanced JSON object/array out of a model's text response. */
function extractJson(raw: string): unknown | null {
  const trimmed = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  // Try direct parse first
  try {
    return JSON.parse(trimmed);
  } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }
  return null;
}

type RawModel = {
  name?: unknown;
  category?: unknown;
  drive?: unknown;
  reason?: unknown;
  confidence?: unknown;
  sources?: unknown;
};

/** Coerce a parsed `{ models: [...] }` payload into typed candidates. */
function coerceCandidates(
  parsed: unknown,
  importerDomain: string | null,
  fallbackCitations: string[],
): DiscoveredCandidate[] {
  const list =
    parsed && typeof parsed === "object" && Array.isArray((parsed as { models?: unknown }).models)
      ? ((parsed as { models: RawModel[] }).models)
      : Array.isArray(parsed)
        ? (parsed as RawModel[])
        : [];

  const out: DiscoveredCandidate[] = [];
  for (const m of list) {
    const name = typeof m.name === "string" ? m.name.trim() : "";
    if (!name) continue;

    let sources: DiscoverySource[] = Array.isArray(m.sources)
      ? (m.sources as unknown[])
          .map((s) => {
            const obj = s as { url?: unknown; title?: unknown; date?: unknown };
            const url = typeof obj.url === "string" ? obj.url.trim() : "";
            if (!url || !/^https?:\/\//.test(url)) return null;
            return {
              url,
              title: typeof obj.title === "string" ? obj.title : null,
              date: typeof obj.date === "string" && obj.date !== "null" ? obj.date : null,
              kind: classifyKind(url, importerDomain),
            } as DiscoverySource;
          })
          .filter((x): x is DiscoverySource => x !== null)
      : [];

    // If the model gave no per-item sources, attach the response-level citations.
    if (sources.length === 0 && fallbackCitations.length > 0) {
      sources = fallbackCitations.slice(0, 3).map((url) => ({
        url,
        title: null,
        date: null,
        kind: classifyKind(url, importerDomain),
      }));
    }

    sources = filterRecentSources(sources);

    const conf = typeof m.confidence === "string" ? m.confidence.toLowerCase() : "";
    out.push({
      name,
      category_guess: typeof m.category === "string" ? m.category : null,
      drive_guess: typeof m.drive === "string" ? m.drive : null,
      reason: typeof m.reason === "string" ? m.reason : null,
      sources,
      confidence: conf === "high" || conf === "low" ? conf : "medium",
    });
  }
  return out;
}

function buildPrompt(brandName: string, existingNames: string[]): string {
  const known = existingNames.length ? existingNames.join(", ") : "(egyelőre egy sincs az adatbázisban)";
  return `Autópiaci kutató feladat. Keresd meg a(z) ${brandName} márka azon SZEMÉLYGÉPKOCSI-modelljeit, amelyeket mostanában vezettek be vagy hamarosan bevezetnek a MAGYAR piacon, és amelyek MÉG NINCSENEK az alábbi listánkon.

Már ismert ${brandName} modellek (ezeket NE sorold fel, és a változataikat se — pl. ha "Tiggo 7" szerepel, a "Tiggo 7 Pro" külön modellnek számít, de a puszta "Tiggo 7" nem): ${known}

Szigorú szabályok:
- Csak olyan modell kerülhet be, amely ténylegesen elérhető vagy hivatalosan bejelentették a magyar piacra.
- Csak egy hónapnál nem régebbi hír vagy a gyártó/importőr hivatalos magyar oldala számít forrásnak.
- Magyar nyelvű forrásokat részesíts előnyben (gyártó hivatalos magyar oldala, magyar autós hírportálok).
- Ha bizonytalan vagy egy modell magyar piaci elérhetőségében, inkább hagyd ki.

Válasz KIZÁRÓLAG érvényes JSON, minden más szöveg nélkül, ebben a formában:
{"models":[{"name":"modell neve márka nélkül","category":"kategória magyarul vagy null","drive":"benzin|dízel|önttöltő hibrid|plug-in hibrid|elektromos vagy null","reason":"max 15 szavas indok magyarul","confidence":"high|medium|low","sources":[{"url":"https://...","title":"cím","date":"YYYY-MM-DD vagy null"}]}]}

Ha nincs ilyen új modell: {"models":[]}`;
}

// ─── Provider 1: Perplexity ───────────────────────────────────────────────────
async function discoverViaPerplexity(
  brand: DiscoveryBrandInput,
  existingNames: string[],
): Promise<DiscoveryResult> {
  const importerDomain = brand.importer_site ? cleanDomain(brand.importer_site) : null;
  let res: Response;
  try {
    res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "Pontos, tényszerű autópiaci kutató vagy. Kizárólag érvényes JSON-t adsz vissza, magyarázó szöveg nélkül. Nem találsz ki modelleket.",
          },
          { role: "user", content: buildPrompt(brand.name, existingNames) },
        ],
        temperature: 0.1,
        max_tokens: 1300,
        search_recency_filter: "month",
      }),
      cache: "no-store",
    });
  } catch (e) {
    return { provider: "perplexity", candidates: [], error: `fetch failed: ${e}` };
  }

  const text = await res.text();
  if (!res.ok) {
    return { provider: "perplexity", candidates: [], error: `HTTP ${res.status}: ${text.slice(0, 300)}` };
  }

  let json: {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  try {
    json = JSON.parse(text);
  } catch {
    return { provider: "perplexity", candidates: [], error: `non-JSON response: ${text.slice(0, 200)}` };
  }

  const content = json.choices?.[0]?.message?.content ?? "";
  const citations = Array.isArray(json.citations) ? json.citations.filter((c) => typeof c === "string") : [];
  const parsed = extractJson(content);
  if (parsed === null) {
    return { provider: "perplexity", candidates: [], error: "could not parse model JSON" };
  }
  return { provider: "perplexity", candidates: coerceCandidates(parsed, importerDomain, citations) };
}

// ─── Provider 2: Serper + Claude ──────────────────────────────────────────────
type SerperOrganic = { link: string; title: string; snippet?: string; date?: string };

async function serperOrganic(query: string): Promise<SerperOrganic[]> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "hu", hl: "hu", num: 10, tbs: "qdr:m" }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { organic?: SerperOrganic[] };
    return json.organic ?? [];
  } catch {
    return [];
  }
}

async function discoverViaSerperClaude(
  brand: DiscoveryBrandInput,
  existingNames: string[],
): Promise<DiscoveryResult> {
  const importerDomain = brand.importer_site ? cleanDomain(brand.importer_site) : null;
  const year = new Date().getFullYear();
  const queries = [
    `${brand.name} új modell ${year} Magyarország ár`,
    `${brand.name} ${year} bemutató teszt Magyarország`,
  ];
  if (importerDomain) queries.push(`${brand.name} modellek site:${importerDomain}`);

  const resultsArr = await Promise.all(queries.map(serperOrganic));
  const seen = new Set<string>();
  const organic: SerperOrganic[] = [];
  for (const arr of resultsArr) {
    for (const r of arr) {
      if (!r.link || seen.has(r.link)) continue;
      seen.add(r.link);
      organic.push(r);
    }
  }

  if (organic.length === 0) {
    return { provider: "serper+claude", candidates: [], error: "no search results" };
  }

  const known = existingNames.length ? existingNames.join(", ") : "(egyelőre egy sincs)";
  const resultsBlock = organic
    .slice(0, 18)
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.link}${r.date ? `\n(dátum: ${r.date})` : ""}\n${(r.snippet ?? "").slice(0, 220)}`)
    .join("\n\n");

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  let content = "";
  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1300,
      messages: [
        {
          role: "user",
          content: `Autópiaci elemző feladat. Az alábbi Google-találatok a(z) ${brand.name} márkáról szólnak. Azonosítsd azokat a SZEMÉLYGÉPKOCSI-modelleket, amelyek a magyar piacon újak, és NINCSENEK az alábbi listánkon.

Már ismert ${brand.name} modellek (ezeket NE add vissza): ${known}

Google-találatok:
${resultsBlock}

Szabályok:
- Csak valódi, a magyar piacon elérhető vagy bejelentett modellek.
- Egy hónapnál régebbi hírt ne vegyél figyelembe.
- A forrás URL-t a fenti találatok közül válaszd.

Válasz KIZÁRÓLAG érvényes JSON, más szöveg nélkül:
{"models":[{"name":"modell neve márka nélkül","category":"kategória vagy null","drive":"hajtás vagy null","reason":"max 15 szó","confidence":"high|medium|low","sources":[{"url":"...","title":"...","date":"YYYY-MM-DD vagy null"}]}]}
Ha nincs új modell: {"models":[]}`,
        },
      ],
    });
    content = (msg.content[0] as { type: string; text: string }).text ?? "";
  } catch (e) {
    return { provider: "serper+claude", candidates: [], error: `Claude failed: ${e}` };
  }

  const parsed = extractJson(content);
  if (parsed === null) {
    return { provider: "serper+claude", candidates: [], error: "could not parse model JSON" };
  }
  return { provider: "serper+claude", candidates: coerceCandidates(parsed, importerDomain, []) };
}

// ─── Public entry point ───────────────────────────────────────────────────────
/**
 * Researches new models for a single brand. Filters out any candidate whose
 * (normalized) name already exists in `existingNames`. Picks the best available
 * provider automatically.
 */
export async function discoverNewModelsForBrand(
  brand: DiscoveryBrandInput,
  existingNames: string[],
): Promise<DiscoveryResult> {
  let result: DiscoveryResult;
  if (HAS_PERPLEXITY) {
    result = await discoverViaPerplexity(brand, existingNames);
    // If Perplexity errored but we have the Serper+Claude path, try that as backup.
    if (result.error && HAS_SERPER && HAS_ANTHROPIC) {
      const backup = await discoverViaSerperClaude(brand, existingNames);
      if (!backup.error) result = backup;
    }
  } else if (HAS_SERPER && HAS_ANTHROPIC) {
    result = await discoverViaSerperClaude(brand, existingNames);
  } else {
    return {
      provider: "none",
      candidates: [],
      error:
        "Nincs kutatási API beállítva. Adj meg PERPLEXITY_API_KEY-t (ajánlott), vagy SERPER_API_KEY + ANTHROPIC_API_KEY párost a környezeti változók közt.",
    };
  }

  // Final dedupe guard: drop anything matching an existing model name.
  const existingSet = new Set(existingNames.map(normalizeModelName));
  result.candidates = result.candidates.filter(
    (c) => !existingSet.has(normalizeModelName(c.name)),
  );
  return result;
}

export const DISCOVERY_PROVIDER: DiscoveryResult["provider"] = HAS_PERPLEXITY
  ? "perplexity"
  : HAS_SERPER && HAS_ANTHROPIC
    ? "serper+claude"
    : "none";
