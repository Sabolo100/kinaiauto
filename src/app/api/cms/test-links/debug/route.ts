// GET /api/cms/test-links/debug?brand=BYD&model=Atto+3
// Returns raw API responses for diagnosing search issues.
// Only accessible from CMS (no public exposure).
import { NextRequest, NextResponse } from "next/server";
import { searchTestLinksDebug } from "@/lib/test-link-search";
import { HAS_GOOGLE_CSE, HAS_YOUTUBE, GOOGLE_CSE_CX, GOOGLE_CSE_API_KEY, YOUTUBE_API_KEY } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const brand = searchParams.get("brand") ?? "BYD";
  const model = searchParams.get("model") ?? "Atto 3";

  const debug = await searchTestLinksDebug(brand, model);

  return NextResponse.json({
    config: {
      hasGoogleCse: HAS_GOOGLE_CSE,
      hasYoutube: HAS_YOUTUBE,
      // Show only last 4 chars of keys for security
      googleKeyHint: GOOGLE_CSE_API_KEY ? `...${GOOGLE_CSE_API_KEY.slice(-4)}` : "NOT SET",
      googleCxHint: GOOGLE_CSE_CX ? `...${GOOGLE_CSE_CX.slice(-6)}` : "NOT SET",
      youtubeKeyHint: YOUTUBE_API_KEY ? `...${YOUTUBE_API_KEY.slice(-4)}` : "NOT SET",
    },
    search: debug,
  }, { status: 200 });
}
