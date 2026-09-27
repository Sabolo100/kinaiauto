// /llms-full.txt — every brand and model as plain, quotable text, so AI
// assistants can answer "Mennyibe kerül a BYD Sealion 7?" without rendering JS.
// Built from the database by lib/llms.ts.

import { getBrands, getModels, getCategories, getDrives, getDataLastUpdated } from "@/lib/data";
import { buildLlmsFullTxt } from "@/lib/llms";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const [brands, models, cats, drives, lastUpdated] = await Promise.all([
    getBrands(),
    getModels(),
    getCategories(),
    getDrives(),
    getDataLastUpdated(),
  ]);
  return new Response(buildLlmsFullTxt(brands, models, cats, drives, lastUpdated), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
