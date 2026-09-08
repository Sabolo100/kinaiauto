// POST /api/track — fire-and-forget analytics event ingestion.
// Called via navigator.sendBeacon from the browser — no response body needed.
import { NextRequest, NextResponse } from "next/server";
import { db, HAS_DB } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set(["model_view", "gallery_open", "filter_catalog", "catalog_param"]);

export async function POST(req: NextRequest) {
  let body: { type?: string; model_id?: string; model_slug?: string; param?: string; val?: string };
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const type = typeof body?.type === "string" ? body.type : null;
  if (!type || !ALLOWED_TYPES.has(type) || !HAS_DB) {
    return new NextResponse(null, { status: 204 });
  }

  // Fire-and-forget — don't await, respond immediately. Swallow errors so a
  // rejected promise can never surface as an unhandled rejection.
  void db()`insert into site_events ${db()({
    type,
    model_id: body.model_id ?? null,
    model_slug: body.model_slug ?? null,
    param: body.param ?? null,
    val: body.val ?? null,
  })}`.catch(() => {});

  return new NextResponse(null, { status: 204 });
}
