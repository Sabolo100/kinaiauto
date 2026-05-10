import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ALLOWED = [
  "slug","name","tagline","description","founded","hq","factories",
  "parent_company","importer_name","importer_addr","importer_site",
  "dealers_text","hero_color","brand_tone","sort_order","is_active",
  "archived_at",
] as const;

function pick(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (k in input) out[k] = input[k];
  }
  return out;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("brands")
    .update(pick(body))
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // Soft-delete via archive
  const { id } = await ctx.params;
  const sa = supabaseAdmin();
  const { error } = await sa
    .from("brands")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
