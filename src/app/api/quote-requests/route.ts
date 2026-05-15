import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getSettings } from "@/lib/settings";
import {
  buildHtmlBody,
  buildSubject,
  buildTextBody,
  type EmailModel,
} from "@/lib/quote-email";

export const runtime = "nodejs";
export const maxDuration = 60;

type IncomingItem = {
  modelId: string;
  brandId: string;
  modelName: string;
  brandName: string;
  modelSlug: string;
  brandSlug: string;
};

type IncomingBody = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  gdpr_accepted: boolean;
  items: IncomingItem[];
  /** brand_id → dealer_id[] */
  dealer_ids_by_brand: Record<string, string[]>;
};

export async function POST(req: NextRequest) {
  let body: IncomingBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // ── Validate ────────────────────────────────────────────────────────────
  const name = (body.customer_name ?? "").trim();
  const email = (body.customer_email ?? "").trim();
  const phone = (body.customer_phone ?? "").trim();

  if (name.length < 2) {
    return NextResponse.json({ error: "Hiányzó vagy túl rövid név." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Érvénytelen e-mail cím." }, { status: 400 });
  }
  if (phone.replace(/[^\d+]/g, "").length < 6) {
    return NextResponse.json({ error: "Érvénytelen telefonszám." }, { status: 400 });
  }
  if (!body.gdpr_accepted) {
    return NextResponse.json({ error: "GDPR hozzájárulás szükséges." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "A kosár üres." }, { status: 400 });
  }
  if (!body.dealer_ids_by_brand || typeof body.dealer_ids_by_brand !== "object") {
    return NextResponse.json(
      { error: "Hiányzik a kiválasztott kereskedők listája." },
      { status: 400 },
    );
  }

  // ── Load settings & max-cap ────────────────────────────────────────────
  const settings = await getSettings(
    [
      "resend_api_key",
      "resend_from_email",
      "resend_from_name",
      "quote_max_dealers_per_brand",
      "quote_email_subject_template",
    ],
    {
      resend_from_email: "ajanlat@kinaiauto.com",
      resend_from_name: "kinaiauto.com",
      quote_max_dealers_per_brand: "3",
    },
  );

  const maxDealers = Math.max(1, parseInt(settings.quote_max_dealers_per_brand, 10) || 3);
  const apiKey = settings.resend_api_key?.trim();
  const fromEmail = settings.resend_from_email?.trim() || "ajanlat@kinaiauto.com";
  const fromName = settings.resend_from_name?.trim() || "kinaiauto.com";
  const subjectTpl = settings.quote_email_subject_template?.trim() || undefined;

  // Group items by brand
  const itemsByBrand = new Map<string, IncomingItem[]>();
  for (const it of body.items) {
    if (!itemsByBrand.has(it.brandId)) itemsByBrand.set(it.brandId, []);
    itemsByBrand.get(it.brandId)!.push(it);
  }

  // Validate every brand has dealers and ≤ max
  for (const [brandId, ids] of Object.entries(body.dealer_ids_by_brand)) {
    if (!itemsByBrand.has(brandId)) continue; // dealer selected for brand not in cart — ignore
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Minden márkához legalább 1 kereskedőt ki kell választani." },
        { status: 400 },
      );
    }
    if (ids.length > maxDealers) {
      return NextResponse.json(
        { error: `Maximum ${maxDealers} kereskedő választható márkánként.` },
        { status: 400 },
      );
    }
  }

  // Every cart brand needs at least one dealer
  for (const brandId of itemsByBrand.keys()) {
    const sel = body.dealer_ids_by_brand[brandId];
    if (!sel || sel.length === 0) {
      return NextResponse.json(
        { error: "Minden kosárban szereplő márkához ki kell választani kereskedőket." },
        { status: 400 },
      );
    }
  }

  // ── Persist quote_request + items ───────────────────────────────────────
  const sa = supabaseAdmin();
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

  const { data: qrInsert, error: qrErr } = await sa
    .from("quote_requests")
    .insert({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      gdpr_accepted_at: new Date().toISOString(),
      status: "pending",
      user_agent: userAgent,
    })
    .select("id")
    .single();

  if (qrErr || !qrInsert) {
    return NextResponse.json(
      { error: `DB hiba (quote_requests): ${qrErr?.message ?? "ismeretlen"}` },
      { status: 500 },
    );
  }
  const quoteRequestId = qrInsert.id as string;

  // Insert items
  const itemRows = body.items.map((it) => ({
    quote_request_id: quoteRequestId,
    brand_id: it.brandId,
    model_id: it.modelId,
    brand_name_snapshot: it.brandName,
    model_name_snapshot: it.modelName,
    brand_slug_snapshot: it.brandSlug,
    model_slug_snapshot: it.modelSlug,
  }));
  const { error: itemsErr } = await sa.from("quote_request_items").insert(itemRows);
  if (itemsErr) {
    return NextResponse.json(
      { error: `DB hiba (items): ${itemsErr.message}` },
      { status: 500 },
    );
  }

  // ── Fetch dealer info for each selected dealer ──────────────────────────
  const allDealerIds = Array.from(
    new Set(Object.values(body.dealer_ids_by_brand).flat()),
  );
  const { data: dealersData, error: dealersErr } = await sa
    .from("dealers")
    .select("id, name, email, brand_id")
    .in("id", allDealerIds);

  if (dealersErr) {
    return NextResponse.json(
      { error: `DB hiba (dealers): ${dealersErr.message}` },
      { status: 500 },
    );
  }
  const dealerById = new Map(
    (dealersData ?? []).map((d) => [d.id as string, d as { id: string; name: string; email: string | null; brand_id: string }]),
  );

  // ── Build dispatch plan: one per (brand, dealer) ───────────────────────
  type Dispatch = {
    brandId: string;
    dealerId: string;
    dealerEmail: string;
    dealerName: string;
    brandName: string;
    models: EmailModel[];
  };
  const dispatches: Dispatch[] = [];

  for (const [brandId, dealerIds] of Object.entries(body.dealer_ids_by_brand)) {
    const items = itemsByBrand.get(brandId);
    if (!items || items.length === 0) continue;
    const brandName = items[0].brandName;
    const models: EmailModel[] = items.map((it) => ({
      modelName: it.modelName,
      brandName: it.brandName,
      brandSlug: it.brandSlug,
      modelSlug: it.modelSlug,
    }));

    for (const did of dealerIds) {
      const d = dealerById.get(did);
      if (!d) continue;
      const dealerEmail = (d.email ?? "").trim();
      if (!dealerEmail) {
        // skip dealers without an email, but still record the dispatch as failed
        dispatches.push({
          brandId,
          dealerId: did,
          dealerEmail: "",
          dealerName: d.name,
          brandName,
          models,
        });
        continue;
      }
      dispatches.push({
        brandId,
        dealerId: did,
        dealerEmail,
        dealerName: d.name,
        brandName,
        models,
      });
    }
  }

  // ── Send emails via Resend ─────────────────────────────────────────────
  console.log(`[quote] dispatches=${dispatches.length} apiKey=${apiKey ? `set(${apiKey.slice(0,6)}…)` : "MISSING"} from=${fromEmail}`);
  for (const d of dispatches) {
    console.log(`[quote]  → dealer=${d.dealerName} email=${d.dealerEmail || "EMPTY"} brand=${d.brandName}`);
  }

  let sentCount = 0;
  const errors: string[] = [];

  if (!apiKey) {
    // No API key — record dispatches as not-sent and return informative error,
    // but the DB rows still capture the user's intent.
    for (const d of dispatches) {
      await sa.from("quote_request_dispatches").insert({
        quote_request_id: quoteRequestId,
        brand_id: d.brandId,
        dealer_id: d.dealerId,
        dealer_email: d.dealerEmail || "",
        subject: buildSubject({
          brandName: d.brandName,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          dealerName: d.dealerName,
          models: d.models,
          subjectTemplate: subjectTpl,
        }),
        success: false,
        error_message: "Resend API kulcs nincs beállítva az admin panelen.",
      });
    }
    await sa
      .from("quote_requests")
      .update({ status: "error" })
      .eq("id", quoteRequestId);
    return NextResponse.json(
      {
        error:
          "A küldés most nem volt lehetséges, mert a kiszolgálón nincs e-mail kulcs konfigurálva. Az igényedet rögzítettük – kérjük, jelezd közvetlenül a kinaiauto.com csapatának.",
        request_id: quoteRequestId,
      },
      { status: 503 },
    );
  }

  // Dynamic import so build still works if dep is missing in some env
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  for (const d of dispatches) {
    const subject = buildSubject({
      brandName: d.brandName,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      dealerName: d.dealerName,
      models: d.models,
      subjectTemplate: subjectTpl,
    });

    if (!d.dealerEmail) {
      await sa.from("quote_request_dispatches").insert({
        quote_request_id: quoteRequestId,
        brand_id: d.brandId,
        dealer_id: d.dealerId,
        dealer_email: "",
        subject,
        success: false,
        error_message: "A kereskedőnek nincs e-mail címe rögzítve.",
      });
      errors.push(`${d.dealerName}: nincs e-mail cím`);
      continue;
    }

    const html = buildHtmlBody({
      brandName: d.brandName,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      dealerName: d.dealerName,
      models: d.models,
    });
    const text = buildTextBody({
      brandName: d.brandName,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      dealerName: d.dealerName,
      models: d.models,
    });

    try {
      const res = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: d.dealerEmail,
        cc: email,
        replyTo: email,
        subject,
        html,
        text,
      });
      console.log(`[quote] resend response for ${d.dealerEmail}:`, JSON.stringify(res));
      const messageId = (res as { data?: { id?: string } }).data?.id ?? null;
      const errorObj = (res as { error?: { message?: string } | null }).error ?? null;
      if (errorObj) {
        console.error(`[quote] resend error for ${d.dealerEmail}:`, errorObj);
        await sa.from("quote_request_dispatches").insert({
          quote_request_id: quoteRequestId,
          brand_id: d.brandId,
          dealer_id: d.dealerId,
          dealer_email: d.dealerEmail,
          subject,
          success: false,
          error_message: errorObj.message ?? "Ismeretlen Resend hiba",
        });
        errors.push(`${d.dealerName}: ${errorObj.message ?? "küldési hiba"}`);
      } else {
        await sa.from("quote_request_dispatches").insert({
          quote_request_id: quoteRequestId,
          brand_id: d.brandId,
          dealer_id: d.dealerId,
          dealer_email: d.dealerEmail,
          subject,
          success: true,
          sent_at: new Date().toISOString(),
          resend_message_id: messageId,
        });
        sentCount++;
      }
    } catch (e) {
      const msg = (e as Error).message ?? "unknown";
      await sa.from("quote_request_dispatches").insert({
        quote_request_id: quoteRequestId,
        brand_id: d.brandId,
        dealer_id: d.dealerId,
        dealer_email: d.dealerEmail,
        subject,
        success: false,
        error_message: msg,
      });
      errors.push(`${d.dealerName}: ${msg}`);
    }
  }

  // Final status
  const finalStatus =
    sentCount === dispatches.length
      ? "sent"
      : sentCount > 0
        ? "partial"
        : "error";
  await sa
    .from("quote_requests")
    .update({ status: finalStatus })
    .eq("id", quoteRequestId);

  return NextResponse.json({
    ok: true,
    request_id: quoteRequestId,
    sent_count: sentCount,
    total_dispatches: dispatches.length,
    errors,
  });
}
