// POST /api/cms/test-links/search
// Creates a search job, then triggers the /run endpoint fire-and-forget.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SITE_URL } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.model_ids) || body.model_ids.length === 0) {
    return NextResponse.json({ error: "model_ids array required" }, { status: 400 });
  }

  const sa = supabaseAdmin();
  const modelIds: string[] = body.model_ids;

  // Create the job record
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

  const jobId = job.id as string;

  // Fire-and-forget: trigger the run endpoint.
  // We don't await this — it runs independently in its own serverless invocation.
  const runUrl = `${SITE_URL}/api/cms/test-links/search/${jobId}/run`;
  fetch(runUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-token": process.env.CMS_SESSION_SECRET ?? "" },
  }).catch(() => {
    // Ignore — the client will see "pending" status and can re-trigger if needed
  });

  return NextResponse.json({ jobId });
}
