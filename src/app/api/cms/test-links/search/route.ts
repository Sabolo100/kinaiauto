// POST /api/cms/test-links/search
// Creates a search job and starts background processing via after()
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { searchTestLinks } from "@/lib/test-link-search";

export const runtime = "nodejs";
export const maxDuration = 60; // Vercel: allow up to 60s before after() takes over

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
    return NextResponse.json({ error: error?.message ?? "failed" }, { status: 500 });
  }

  const jobId = job.id as string;

  // Kick off background processing after the response is sent
  after(async () => {
    await runSearchJob(jobId, modelIds);
  });

  return NextResponse.json({ jobId });
}

// ─── Background search runner ─────────────────────────────────────────────────
async function runSearchJob(jobId: string, modelIds: string[]) {
  const sa = supabaseAdmin();

  // Fetch model info for the selected IDs
  const { data: models } = await sa
    .from("models")
    .select("id, name, brand:brands(name)")
    .in("id", modelIds);

  if (!models?.length) {
    await sa
      .from("test_link_search_jobs")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", jobId);
    return;
  }

  // Mark as running
  await sa
    .from("test_link_search_jobs")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  const progress: Record<string, { found: number; done: boolean }> = {};
  let totalFound = 0;

  for (const model of models) {
    const brandName = (model.brand as unknown as { name: string } | null)?.name ?? "";
    const modelName = model.name as string;
    const modelId = model.id as string;
    const label = `${brandName} ${modelName}`.trim();

    // Update current model in job
    await sa
      .from("test_link_search_jobs")
      .update({
        current_model: label,
        progress,
        total_found: totalFound,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    progress[modelId] = { found: 0, done: false };

    try {
      const links = await searchTestLinks(brandName, modelName);

      // Deduplicate against already-existing links for this model
      const { data: existing } = await sa
        .from("model_test_links")
        .select("url")
        .eq("model_id", modelId);
      const existingUrls = new Set((existing ?? []).map((e) => e.url as string));

      const toInsert = links.filter((l) => !existingUrls.has(l.url));

      if (toInsert.length > 0) {
        await sa.from("model_test_links").insert(
          toInsert.map((l) => ({
            model_id: modelId,
            url: l.url,
            title: l.title || null,
            source_name: l.source_name,
            kind: l.kind,
            is_approved: false, // needs admin approval
            found_by: "auto",
          })),
        );
      }

      progress[modelId] = { found: toInsert.length, done: true };
      totalFound += toInsert.length;
    } catch {
      progress[modelId] = { found: 0, done: true };
    }

    // Brief pause to not hammer APIs
    await new Promise((r) => setTimeout(r, 500));
  }

  // Mark job complete
  await sa
    .from("test_link_search_jobs")
    .update({
      status: "completed",
      current_model: null,
      progress,
      total_found: totalFound,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}
