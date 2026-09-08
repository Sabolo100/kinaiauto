import { NextRequest, NextResponse } from "next/server";
import { db, updateById } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED = [
  "slug","name","tagline","description","founded","hq","factories",
  "parent_company","importer_name","importer_addr","importer_site",
  "dealers_text","hero_color","brand_tone","sort_order","is_active",
  "archived_at",
] as const;

function pick(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in input) out[k] = input[k];
  return out;
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  try {
    const data = await updateById("brands", id, pick(body));
    if (!data) return NextResponse.json({ error: "márka nem található" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  // Soft-delete via archive
  const { id } = await ctx.params;
  try {
    await db()`update brands set archived_at = now() where id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
