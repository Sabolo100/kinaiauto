// PATCH /api/cms/test-links/[id]   → approve / update title
// DELETE /api/cms/test-links/[id]  → delete (reject)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const sa = supabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.is_approved === "boolean") patch.is_approved = body.is_approved;
  if (body.title !== undefined) patch.title = body.title?.trim() || null;

  const { error } = await sa.from("model_test_links").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sa = supabaseAdmin();
  const { error } = await sa.from("model_test_links").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
