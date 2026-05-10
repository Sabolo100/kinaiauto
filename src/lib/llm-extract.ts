// LLM-based structured extraction from raw text (PDF/HTML).
// Both providers return the same JSON shape so the UI can diff against
// the existing model row uniformly.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  ANTHROPIC_API_KEY,
  HAS_ANTHROPIC,
  HAS_OPENAI,
  OPENAI_API_KEY,
} from "./env";

export type ExtractedFields = {
  // identification (informational only — never overwrites brand/slug/name)
  brand_name?: string | null;
  model_name?: string | null;
  variant_or_trim?: string | null;

  // pricing (HUF; we'll convert to M Ft if absolute)
  price_min_huf?: number | null;
  price_max_huf?: number | null;
  price_min_m_ft?: number | null;
  price_max_m_ft?: number | null;

  // dimensions
  length_mm?: number | null;
  width_mm?: number | null;
  height_mm?: number | null;
  wheelbase_mm?: number | null;
  trunk_l?: number | null;
  seats?: number | null;

  // powertrain
  power_hp?: number | null;
  battery_kwh?: number | null;
  range_km?: number | null;
  consumption_text?: string | null;
  acceleration_s?: number | null;

  // charging
  charging_ac_kw?: number | null;
  charging_dc_kw?: number | null;
  charging_text?: string | null;

  // warranty
  warranty_years?: number | null;
  warranty_km?: number | null;
  battery_warranty_years?: number | null;
  battery_warranty_km?: number | null;

  // freeform notes
  notes?: string | null;
};

export type LlmProvider = "claude" | "openai";

export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const OPENAI_MODEL = "gpt-4.5";

const SYSTEM_PROMPT = `You are an automotive data extractor for a Hungarian car-comparison website (kinaiauto.com).
Read the supplied source text (a manufacturer pricelist PDF or product webpage, often Hungarian) and extract the model's technical specifications.

Output STRICT JSON with this exact shape (no markdown, no commentary):

{
  "brand_name": string | null,
  "model_name": string | null,
  "variant_or_trim": string | null,
  "price_min_huf": number | null,
  "price_max_huf": number | null,
  "price_min_m_ft": number | null,
  "price_max_m_ft": number | null,
  "length_mm": number | null,
  "width_mm": number | null,
  "height_mm": number | null,
  "wheelbase_mm": number | null,
  "trunk_l": number | null,
  "seats": number | null,
  "power_hp": number | null,
  "battery_kwh": number | null,
  "range_km": number | null,
  "consumption_text": string | null,
  "acceleration_s": number | null,
  "charging_ac_kw": number | null,
  "charging_dc_kw": number | null,
  "charging_text": string | null,
  "warranty_years": number | null,
  "warranty_km": number | null,
  "battery_warranty_years": number | null,
  "battery_warranty_km": number | null,
  "notes": string | null
}

Rules:
- Use null when a field is not stated. Never invent values.
- Prices: pricelists usually quote HUF. Set price_min_huf/price_max_huf to the lowest and highest list price (any trim). Also set price_min_m_ft = round(price_min_huf / 1_000_000, 2) and same for max.
- Power: prefer the system / total power in HP (LE). If only kW given, convert (1 kW ≈ 1.36 LE) and round.
- Battery: usable kWh if both gross and net are given; otherwise the figure stated.
- Range: WLTP combined km. If multiple variants, pick the longest WLTP range.
- consumption_text: keep as a short Hungarian string ("5,5 l/100 km" or "17,2 kWh/100 km").
- charging_text: short Hungarian string covering DC fast-charge time ("30 perc 10→80% (DC 80 kW)") if available.
- warranty_km / battery_warranty_km in kilometres (parse "200 000 km" → 200000).
- "notes": one or two short Hungarian sentences if there's something worth flagging (e.g., "Ár állami támogatás nélkül." or "Csak Lounge szintű felszereltségben elérhető.").

Be concise and conservative.`;

function safeParse(s: string): unknown {
  // Strip code fences if model added them despite instructions.
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\n/i, "").replace(/\n?```$/, "");
  }
  // Find first { ... last }
  const i = t.indexOf("{");
  const j = t.lastIndexOf("}");
  if (i >= 0 && j > i) t = t.slice(i, j + 1);
  return JSON.parse(t);
}

function clamp(text: string, max = 80000): string {
  if (text.length <= max) return text;
  // Keep both ends — pricelists put pricing later in the doc.
  const half = Math.floor(max / 2);
  return text.slice(0, half) + "\n…[trimmed]…\n" + text.slice(text.length - half);
}

export async function extractWithClaude(
  text: string,
  hint: string,
): Promise<{ json: ExtractedFields; model: string }> {
  if (!HAS_ANTHROPIC) throw new Error("ANTHROPIC_API_KEY hiányzik");
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const trimmed = clamp(text);
  const msg = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Existing record context:\n${hint}\n\nSource text:\n---\n${trimmed}\n---\n\nReturn the JSON only.`,
      },
    ],
  });
  const block = msg.content.find((b) => b.type === "text");
  const out = block && "text" in block ? block.text : "";
  return { json: safeParse(out) as ExtractedFields, model: CLAUDE_MODEL };
}

export async function extractWithOpenAI(
  text: string,
  hint: string,
): Promise<{ json: ExtractedFields; model: string }> {
  if (!HAS_OPENAI) throw new Error("OPENAI_API_KEY hiányzik");
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });
  const trimmed = clamp(text);
  const resp = await client.chat.completions.create({
    model: OPENAI_MODEL,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Existing record context:\n${hint}\n\nSource text:\n---\n${trimmed}\n---\n\nReturn the JSON only.`,
      },
    ],
  });
  const out = resp.choices[0]?.message?.content ?? "";
  return { json: safeParse(out) as ExtractedFields, model: OPENAI_MODEL };
}

export async function extractWith(
  provider: LlmProvider,
  text: string,
  hint: string,
): Promise<{ json: ExtractedFields; model: string }> {
  return provider === "claude"
    ? extractWithClaude(text, hint)
    : extractWithOpenAI(text, hint);
}

// Maps the LLM's JSON to a partial models-row update payload, used when
// the admin approves an extraction.
export function extractedToModelPatch(
  ex: ExtractedFields,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (v === null || v === undefined || v === "") return;
    patch[k] = v;
  };

  // Prefer the explicit M Ft fields, otherwise convert from HUF.
  const minMFt =
    ex.price_min_m_ft ??
    (ex.price_min_huf != null
      ? Math.round((ex.price_min_huf / 1_000_000) * 100) / 100
      : null);
  const maxMFt =
    ex.price_max_m_ft ??
    (ex.price_max_huf != null
      ? Math.round((ex.price_max_huf / 1_000_000) * 100) / 100
      : null);

  set("price_min_m_ft", minMFt);
  set("price_max_m_ft", maxMFt);
  set("length_mm", ex.length_mm);
  set("width_mm", ex.width_mm);
  set("height_mm", ex.height_mm);
  set("wheelbase_mm", ex.wheelbase_mm);
  set("trunk_l", ex.trunk_l);
  set("seats", ex.seats);
  set("power_hp", ex.power_hp);
  set("battery_kwh", ex.battery_kwh);
  set("range_km", ex.range_km);
  set("consumption_text", ex.consumption_text);
  set("acceleration_s", ex.acceleration_s);
  set("charging_ac_kw", ex.charging_ac_kw);
  set("charging_dc_kw", ex.charging_dc_kw);
  set("charging_text", ex.charging_text);
  set("warranty_years", ex.warranty_years);
  set("warranty_km", ex.warranty_km);
  set("battery_warranty_years", ex.battery_warranty_years);
  set("battery_warranty_km", ex.battery_warranty_km);
  patch.data_updated_at = new Date().toISOString().slice(0, 10);
  return patch;
}
