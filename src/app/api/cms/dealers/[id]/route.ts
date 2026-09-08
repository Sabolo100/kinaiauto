import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Contact fields arrive as unknown JSON; coerce to text|null for the DB. */
const str = (v: unknown): string | null => (v == null || v === "" ? null : String(v));

const ALLOWED_FIELDS = ["brand_id","name","city","zip_code","street","lat","lng","email","phone","website","notes","is_active","sort_order"] as const;

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const contacts = body.contacts; // may be undefined (partial update) or array
  const { contacts: _c, ...fields } = body;

  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS) if (k in fields) patch[k] = fields[k];

  try {
    await db().begin(async (tx) => {
      if (Object.keys(patch).length > 0) {
        await tx`update dealers set ${tx(patch)} where id = ${id}`;
      }
      // Replace contacts if provided
      if (Array.isArray(contacts)) {
        await tx`delete from dealer_contacts where dealer_id = ${id}`;
        if (contacts.length > 0) {
          await tx`insert into dealer_contacts ${tx(
            (contacts as Record<string, unknown>[]).map((c, i) => ({
              dealer_id: id, name: str(c.name), email: str(c.email),
              phone: str(c.phone), position: str(c.position), sort_order: i,
            })),
          )}`;
        }
      }
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await db()`delete from dealers where id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
