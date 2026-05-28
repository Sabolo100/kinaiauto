// POST /api/track — fire-and-forget analytics event ingestion.
// Called via navigator.sendBeacon from the browser — no response body needed.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "model_view",
  "gallery_open",
  "filter_catalog",
  "catalog_param",
]);

export async function POST(req: NextRequest) {
  let body: {
    type?: string;
    model_id?: string;
    model_slug?: string;
    param?: string;
    val?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const type = typeof body?.type === "string" ? body.type : null;
  if (!type || !ALLOWED_TYPES.has(type)) {
    return new NextResponse(null, { status: 204 });
  }

  // Fire-and-forget — don't await, respond immediately
  const sa = supabaseAdmin();
  void sa.from("site_events")
    .insert({
      type,
      model_id: body.model_id ?? null,
      model_slug: body.model_slug ?? null,
      param: body.param ?? null,
      val: body.val ?? null,
    });

  return new NextResponse(null, { status: 204 });
}
