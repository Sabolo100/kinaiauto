import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET() {
  const sa = supabaseAdmin();
  const { data, error } = await sa
    .from("dealers")
    .select("*, contacts:dealer_contacts(*), brand:brands(id,name,slug)")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid body" }, { status: 400 });
  if (!body.brand_id || !body.name || !body.city) {
    return NextResponse.json({ error: "brand_id, name, city kötelező" }, { status: 400 });
  }
  const sa = supabaseAdmin();
  const contacts = body.contacts ?? [];
  delete body.contacts;

  const { data: dealer, error } = await sa
    .from("dealers")
    .insert({
      brand_id: body.brand_id, name: body.name, city: body.city,
      zip_code: body.zip_code ?? null, street: body.street ?? null,
      lat: body.lat ?? null, lng: body.lng ?? null,
      email: body.email ?? null, phone: body.phone ?? null,
      website: body.website ?? null, notes: body.notes ?? null,
      is_active: body.is_active ?? true, sort_order: body.sort_order ?? 0,
    })
    .select("*").single();
  if (error || !dealer) return NextResponse.json({ error: error?.message ?? "insert failed" }, { status: 500 });

  if (contacts.length > 0) {
    await sa.from("dealer_contacts").insert(
      contacts.map((c: Record<string, unknown>, i: number) => ({
        dealer_id: dealer.id, name: c.name ?? null, email: c.email ?? null,
        phone: c.phone ?? null, position: c.position ?? null, sort_order: i,
      }))
    );
  }
  return NextResponse.json({ id: dealer.id });
}
