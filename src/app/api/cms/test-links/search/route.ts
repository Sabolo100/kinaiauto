// POST /api/cms/test-links/search
// Creates a search job and returns the jobId.
// The client is responsible for triggering /run after this.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.model_ids) || body.model_ids.length === 0) {
    return NextResponse.json({ error: "model_ids array required" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const modelIds: string[] = body.model_ids;

  const { data: job, error } = await sa
    .from("test_link_search_jobs")
    .insert({
      status: "pending",
      model_ids: modelIds,
      progress: {},
      total_found: 0,
    })
    .select()
    .single();

  if (error || !job) {
    return NextResponse.json({ error: error?.message ?? "failed to create job" }, { status: 500 });
  }

  return NextResponse.json({ jobId: job.id });
}
