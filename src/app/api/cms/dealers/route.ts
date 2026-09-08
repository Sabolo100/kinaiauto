import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** Contact fields arrive as unknown JSON; coerce to text|null for the DB. */
const str = (v: unknown): string | null => (v == null || v === "" ? null : String(v));

export async function GET() {
  try {
    // Embeds mirror the old PostgREST shapes:
    //   contacts → dealer_contacts[] (sorted, [] when none)
    //   brand    → { id, name, slug }
    const data = await db()`
      select d.*,
        coalesce(
          (select json_agg(c order by c.sort_order) from dealer_contacts c where c.dealer_id = d.id),
          '[]'::json) as contacts,
        json_build_object('id', b.id, 'name', b.name, 'slug', b.slug) as brand
      from dealers d
      left join brands b on b.id = d.brand_id
      order by d.sort_order`;
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  if (!body.brand_id || !body.name || !body.city) {
    return NextResponse.json({ error: "brand_id, name, city kötelező" }, { status: 400 });
  }
  const contacts: Record<string, unknown>[] = Array.isArray(body.contacts) ? body.contacts : [];

  try {
    const id = await db().begin(async (tx) => {
      const [dealer] = await tx<{ id: string }[]>`
        insert into dealers ${tx({
          brand_id: body.brand_id, name: body.name, city: body.city,
          zip_code: body.zip_code ?? null, street: body.street ?? null,
          lat: body.lat ?? null, lng: body.lng ?? null,
          email: body.email ?? null, phone: body.phone ?? null,
          website: body.website ?? null, notes: body.notes ?? null,
          is_active: body.is_active ?? true, sort_order: body.sort_order ?? 0,
        })} returning id`;
      if (contacts.length > 0) {
        await tx`insert into dealer_contacts ${tx(
          contacts.map((c, i) => ({
            dealer_id: dealer.id, name: str(c.name), email: str(c.email),
            phone: str(c.phone), position: str(c.position), sort_order: i,
          })),
        )}`;
      }
      return dealer.id;
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message ?? "insert failed" }, { status: 500 });
  }
}
