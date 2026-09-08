import { NextRequest, NextResponse } from "next/server";
import { db, insertOne } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED = [
  "slug","name","tagline","description","founded","hq","factories",
  "parent_company","importer_name","importer_addr","importer_site",
  "dealers_text","hero_color","brand_tone","sort_order","is_active",
] as const;

function pick(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) if (k in input) out[k] = input[k];
  return out;
}

export async function GET() {
  try {
    const data = await db()`select * from brands order by sort_order asc`;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  if (!body.slug || !body.name) {
    return NextResponse.json({ error: "slug és name kötelező" }, { status: 400 });
  }
  try {
    const data = await insertOne("brands", pick(body));
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
