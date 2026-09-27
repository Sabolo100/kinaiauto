// /llms.txt — short, factual site summary + index (https://llmstxt.org).
// Built from the database by lib/llms.ts.

import { getBrands, getModels, getDataLastUpdated } from "@/lib/data";
import { buildLlmsTxt } from "@/lib/llms";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const [brands, models, lastUpdated] = await Promise.all([getBrands(), getModels(), getDataLastUpdated()]);
  return new Response(buildLlmsTxt(brands, models, lastUpdated), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
