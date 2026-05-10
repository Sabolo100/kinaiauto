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

  if (body.is_primary === true) {
    const cur = await sa.from("model_photos").select("model_id").eq("id", id).single();
    if (!cur.error && cur.data) {
      await sa
        .from("model_photos")
        .update({ is_primary: false })
        .eq("model_id", cur.data.model_id)
        .eq("is_primary", true);
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.kind !== undefined) patch.kind = body.kind;
  if (body.is_primary !== undefined) patch.is_primary = body.is_primary;

  const { data, error } = await sa
    .from("model_photos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, row: data });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const sa = supabaseAdmin();

  const photo = await sa
    .from("model_photos")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (photo.error || !photo.data) {
    return NextResponse.json({ error: "fotó nem található" }, { status: 404 });
  }

  await sa.storage.from("car-photos").remove([photo.data.storage_path]);

  const { error } = await sa.from("model_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
