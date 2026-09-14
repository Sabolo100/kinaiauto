import { NextRequest, NextResponse } from "next/server";
import { db, findById, updateById, jsonb } from "@/lib/db";
import { extractedToModelPatch, type ExtractedFields } from "@/lib/llm-extract";

export const runtime = "nodejs";

type Extraction = { id: string; model_id: string | null; parsed_json: Record<string, unknown> };

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const action = body.action as "approve" | "reject" | "edit";

  const exr = await findById<Extraction>("model_extractions", id);
  if (!exr) return NextResponse.json({ error: "kinyerés nem található" }, { status: 404 });

  try {
    if (action === "edit") {
      // Replace parsed_json with admin-edited version.
      const json = body.parsed_json as Record<string, unknown> | undefined;
      if (!json) return NextResponse.json({ error: "parsed_json kötelező" }, { status: 400 });
      const row = await updateById("model_extractions", id, { parsed_json: jsonb(json) }); // jsonb as JSON text
      return NextResponse.json(row);
    }

    if (action === "reject") {
      await db()`update model_extractions
        set status = 'rejected', decided_at = now() where id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      if (!exr.model_id) return NextResponse.json({ error: "nincs hozzárendelt modell" }, { status: 400 });
      const fields = (body.parsed_json as ExtractedFields | undefined) ?? (exr.parsed_json as ExtractedFields);
      const patch = extractedToModelPatch(fields);
      if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: "nincs alkalmazható mező" }, { status: 400 });
      }
      const sql = db();
      await sql.begin(async (tx) => {
        await tx`update models set ${tx(patch)} where id = ${exr.model_id}`;
        await tx`update model_extractions
          set status = 'approved', decided_at = now(), applied_at = now(),
              parsed_json = ${jsonb(fields)}
          where id = ${id}`;
      });
      return NextResponse.json({ ok: true, applied: patch });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  return NextResponse.json({ error: "ismeretlen action" }, { status: 400 });
}
