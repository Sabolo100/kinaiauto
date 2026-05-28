// GET /api/models/[id]/test-links
// Public endpoint — returns only approved test links for a model
import { NextRequest, NextResponse } from "next/server";
import { requireSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const supabase = requireSupabase();

  const { data, error } = await supabase
    .from("model_test_links")
    .select("id, url, title, source_name, kind, found_by, ai_summary, ai_ok")
    .eq("model_id", id)
    .eq("is_approved", true)
    .order("kind") // articles first, then videos
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
