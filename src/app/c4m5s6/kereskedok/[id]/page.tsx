export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { DealerForm } from "@/components/cms/dealer-form";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { HAS_ANTHROPIC, HAS_OPENAI } from "@/lib/env";

async function getBrands() {
  const sa = supabaseAdmin();
  const { data } = await sa.from("brands").select("id, name").eq("is_active", true).order("name");
  return (data ?? []) as { id: string; name: string }[];
}

export default async function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sa = supabaseAdmin();
  const [{ data: d, error }, brands] = await Promise.all([
    sa.from("dealers").select("*, contacts:dealer_contacts(*)").eq("id", id).single(),
    getBrands(),
  ]);
  if (error || !d) return notFound();

  const contacts = ((d.contacts as Record<string, unknown>[]) ?? [])
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((c) => ({ id: String(c.id ?? ""), name: String(c.name ?? ""), email: String(c.email ?? ""), phone: String(c.phone ?? ""), position: String(c.position ?? "") }));

  return (
    <CmsShell>
      <h1>{d.name}</h1>
      <p className="lede">{d.city}{d.zip_code ? ` · ${d.zip_code}` : ""}</p>
      <DealerForm
        mode="edit"
        brands={brands}
        hasClaude={HAS_ANTHROPIC}
        hasOpenAI={HAS_OPENAI}
        initial={{
          id: d.id,
          brand_id: d.brand_id,
          name: d.name,
          city: d.city,
          zip_code: d.zip_code ?? "",
          street: d.street ?? "",
          lat: d.lat != null ? String(d.lat) : "",
          lng: d.lng != null ? String(d.lng) : "",
          email: d.email ?? "",
          phone: d.phone ?? "",
          website: d.website ?? "",
          notes: d.notes ?? "",
          is_active: d.is_active ?? true,
          sort_order: d.sort_order ?? 0,
          contacts,
        }}
      />
    </CmsShell>
  );
}
