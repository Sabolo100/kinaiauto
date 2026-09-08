// GET /api/models/[id]/test-links
// Public endpoint — returns only approved test links for a model.
// Uses the read-only connection; the explicit is_approved filter enforces
// "approved only" (this replaces the old anon RLS policy).
import { NextRequest, NextResponse } from "next/server";
import { dbRo } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const data = await dbRo()`
      select id, url, title, source_name, kind, found_by, ai_summary, ai_ok
      from model_test_links
      where model_id = ${id} and is_approved = true
      order by kind, created_at`; // articles first, then videos
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
