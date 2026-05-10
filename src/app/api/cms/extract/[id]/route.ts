import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { extractedToModelPatch, type ExtractedFields } from "@/lib/llm-extract";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | "edit";

  const sa = supabaseAdmin();
  const exr = await sa
    .from("model_extractions")
    .select("*")
    .eq("id", id)
    .single();
  if (exr.error || !exr.data) {
    return NextResponse.json({ error: "kinyerés nem található" }, { status: 404 });
  }

  if (action === "edit") {
    // Replace parsed_json with admin-edited version.
    const json = body.parsed_json as Record<string, unknown> | undefined;
    if (!json) return NextResponse.json({ error: "parsed_json kötelező" }, { status: 400 });
    const upd = await sa
      .from("model_extractions")
      .update({ parsed_json: json })
      .eq("id", id)
      .select("*")
      .single();
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
    return NextResponse.json(upd.data);
  }

  if (action === "reject") {
    const upd = await sa
      .from("model_extractions")
      .update({ status: "rejected", decided_at: new Date().toISOString() })
      .eq("id", id);
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    if (!exr.data.model_id) {
      return NextResponse.json({ error: "nincs hozzárendelt modell" }, { status: 400 });
    }
    const fields =
      (body.parsed_json as ExtractedFields | undefined) ??
      (exr.data.parsed_json as ExtractedFields);
    const patch = extractedToModelPatch(fields);
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "nincs alkalmazható mező" }, { status: 400 });
    }
    const updModel = await sa
      .from("models")
      .update(patch)
      .eq("id", exr.data.model_id);
    if (updModel.error) {
      return NextResponse.json({ error: updModel.error.message }, { status: 500 });
    }
    const upd = await sa
      .from("model_extractions")
      .update({
        status: "approved",
        decided_at: new Date().toISOString(),
        applied_at: new Date().toISOString(),
        parsed_json: fields as unknown as Record<string, unknown>,
      })
      .eq("id", id);
    if (upd.error) return NextResponse.json({ error: upd.error.message }, { status: 500 });
    return NextResponse.json({ ok: true, applied: patch });
  }

  return NextResponse.json({ error: "ismeretlen action" }, { status: 400 });
}
