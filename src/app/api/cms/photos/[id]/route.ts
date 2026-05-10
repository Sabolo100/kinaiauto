import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

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

  // Best-effort storage cleanup (don't block on storage errors).
  await sa.storage.from("car-photos").remove([photo.data.storage_path]);

  const { error } = await sa.from("model_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
