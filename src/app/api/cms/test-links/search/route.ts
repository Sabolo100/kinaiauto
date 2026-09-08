// POST /api/cms/test-links/search
// Creates a search job and returns the jobId. The client triggers /run after this.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.model_ids) || body.model_ids.length === 0) {
    return NextResponse.json({ error: "model_ids array required" }, { status: 400 });
  }
  const modelIds: string[] = body.model_ids;
  try {
    // model_ids is jsonb → stringify + cast (a bare JS array would become text[]).
    const [job] = await db()<{ id: string }[]>`
      insert into test_link_search_jobs (status, model_ids, progress, total_found)
      values ('pending', ${JSON.stringify(modelIds)}::jsonb, '{}'::jsonb, 0)
      returning id`;
    return NextResponse.json({ jobId: job.id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "failed to create job" }, { status: 500 });
  }
}
