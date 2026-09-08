export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { DealerForm } from "@/components/cms/dealer-form";
import { db } from "@/lib/db";
import { HAS_ANTHROPIC, HAS_OPENAI } from "@/lib/env";

type DealerDbRow = {
  id: string; brand_id: string; name: string; city: string; zip_code: string | null; street: string | null;
  lat: number | null; lng: number | null; email: string | null; phone: string | null; website: string | null;
  notes: string | null; is_active: boolean | null; sort_order: number | null;
  contacts: Record<string, unknown>[];
};

async function getBrands() {
  return db()<{ id: string; name: string }[]>`select id, name from brands where is_active = true order by name`;
}

export default async function EditDealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = db();
  const [[d], brands] = await Promise.all([
    sql<DealerDbRow[]>`
      select d.*,
        coalesce((select json_agg(c) from dealer_contacts c where c.dealer_id = d.id), '[]'::json) as contacts
      from dealers d where d.id = ${id}`,
    getBrands(),
  ]);
  if (!d) return notFound();

  const contacts = (d.contacts ?? [])
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
