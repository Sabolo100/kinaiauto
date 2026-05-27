// GET  /api/cms/test-links          → all models with link counts + pending links
// POST /api/cms/test-links          → manually add a new test link
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// ── GET: models list with counts + pending links ──────────────────────────────
export async function GET() {
  const sa = supabaseAdmin();

  const [modelsRes, linksRes] = await Promise.all([
    // All active models with brand info
    sa
      .from("models")
      .select("id, name, slug, brand:brands(id, name, slug)")
      .order("name"),
    // All test links (approved + pending)
    sa
      .from("model_test_links")
      .select("id, model_id, url, title, source_name, kind, is_approved, found_by, created_at")
      .order("created_at", { ascending: false }),
  ]);

  if (modelsRes.error) return NextResponse.json({ error: modelsRes.error.message }, { status: 500 });
  if (linksRes.error) return NextResponse.json({ error: linksRes.error.message }, { status: 500 });

  const models = modelsRes.data ?? [];
  const links = linksRes.data ?? [];

  // Build per-model counts
  const counts: Record<string, { approved: number; pending: number }> = {};
  for (const l of links) {
    const mid = l.model_id as string;
    if (!counts[mid]) counts[mid] = { approved: 0, pending: 0 };
    if (l.is_approved) counts[mid].approved++;
    else counts[mid].pending++;
  }

  const modelRows = models.map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
    brand: m.brand,
    approved: counts[m.id]?.approved ?? 0,
    pending: counts[m.id]?.pending ?? 0,
  }));

  const pending = links.filter((l) => !l.is_approved);

  return NextResponse.json({ models: modelRows, pending });
}

// ── POST: manually add a test link ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.model_id || !body?.url) {
    return NextResponse.json({ error: "model_id and url required" }, { status: 400 });
  }
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("model_test_links")
    .insert({
      model_id: body.model_id,
      url: body.url.trim(),
      title: body.title?.trim() || null,
      source_name: extractSourceName(body.url),
      kind: body.kind === "video" ? "video" : "article",
      is_approved: true, // manual additions are auto-approved
      found_by: "manual",
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ link: data });
}

function extractSourceName(url: string): string {
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    if (host.includes("youtube")) return "youtube.com";
    return host.replace("www.", "");
  } catch {
    return "";
  }
}
