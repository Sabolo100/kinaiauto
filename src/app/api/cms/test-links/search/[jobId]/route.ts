// GET /api/cms/test-links/search/[jobId]
// Polling endpoint — client polls every 2-3s for job status
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const sa = supabaseAdmin();

  const { data, error } = await sa
    .from("test_link_search_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json(data);
}
