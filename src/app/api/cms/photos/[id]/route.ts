import { NextRequest, NextResponse } from "next/server";
import { db, updateById } from "@/lib/db";
import { removeObjects } from "@/lib/storage";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  const sql = db();

  try {
    if (body.is_primary === true) {
      const [cur] = await sql<{ model_id: string }[]>`select model_id from model_photos where id = ${id}`;
      if (cur) {
        await sql`update model_photos set is_primary = false where model_id = ${cur.model_id} and is_primary = true`;
      }
    }
    const patch: Record<string, unknown> = {};
    if (body.kind !== undefined) patch.kind = body.kind;
    if (body.is_primary !== undefined) patch.is_primary = body.is_primary;

    const row = await updateById("model_photos", id, patch);
    if (!row) return NextResponse.json({ error: "fotó nem található" }, { status: 404 });
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sql = db();
  const [photo] = await sql<{ storage_path: string }[]>`select storage_path from model_photos where id = ${id}`;
  if (!photo) return NextResponse.json({ error: "fotó nem található" }, { status: 404 });

  try {
    await removeObjects("car-photos", [photo.storage_path]);
    await sql`delete from model_photos where id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
