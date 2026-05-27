// GET /api/cms/test-links/debug?brand=BYD&model=Atto+3
// Returns raw API responses for diagnosing search issues.
// Only accessible from CMS (no public exposure).
import { NextRequest, NextResponse } from "next/server";
import { searchTestLinksDebug } from "@/lib/test-link-search";
import { HAS_SERPER, HAS_YOUTUBE, SERPER_API_KEY, YOUTUBE_API_KEY } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get("brand") ?? "BYD";
  const model = searchParams.get("model") ?? "Atto 3";

  const debug = await searchTestLinksDebug(brand, model);

  return NextResponse.json({
    config: {
      hasSerper: HAS_SERPER,
      hasYoutube: HAS_YOUTUBE,
      serperKeyHint: SERPER_API_KEY ? `...${SERPER_API_KEY.slice(-4)}` : "NOT SET",
      youtubeKeyHint: YOUTUBE_API_KEY ? `...${YOUTUBE_API_KEY.slice(-4)}` : "NOT SET",
    },
    search: debug,
  }, { status: 200 });
}
