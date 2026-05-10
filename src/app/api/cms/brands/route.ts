import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ALLOWED = [
  "slug","name","tagline","description","founded","hq","factories",
  "parent_company","importer_name","importer_addr","importer_site",
  "dealers_text","hero_color","brand_tone","sort_order","is_active",
] as const;

function pick(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) {
    if (k in input) out[k] = input[k];
  }
  return out;
}

export async function GET() {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("brands")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  if (!body.slug || !body.name) {
    return NextResponse.json({ error: "slug és name kötelező" }, { status: 400 });
  }
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("brands")
    .insert(pick(body))
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
