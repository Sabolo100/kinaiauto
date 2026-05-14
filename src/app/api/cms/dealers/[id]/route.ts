import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const sa = supabaseAdmin();
  const contacts = body.contacts; // may be undefined (partial update) or array
  const { contacts: _c, ...fields } = body;

  const ALLOWED_FIELDS = ["brand_id","name","city","zip_code","street","lat","lng","email","phone","website","notes","is_active","sort_order"];
  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) if (k in fields) patch[k] = fields[k];

  if (Object.keys(patch).length > 0) {
    const { error } = await sa.from("dealers").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace contacts if provided
  if (Array.isArray(contacts)) {
    await sa.from("dealer_contacts").delete().eq("dealer_id", id);
    if (contacts.length > 0) {
      await sa.from("dealer_contacts").insert(
        contacts.map((c: Record<string, unknown>, i: number) => ({
          dealer_id: id, name: c.name ?? null, email: c.email ?? null,
          phone: c.phone ?? null, position: c.position ?? null, sort_order: i,
        }))
      );
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sa = supabaseAdmin();
  const { error } = await sa.from("dealers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
