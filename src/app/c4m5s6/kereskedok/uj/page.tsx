export const dynamic = "force-dynamic";
import { CmsShell } from "@/components/cms/cms-shell";
import { DealerForm } from "@/components/cms/dealer-form";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { HAS_ANTHROPIC, HAS_OPENAI } from "@/lib/env";

async function getBrands() {
  const sa = supabaseAdmin();
  const { data } = await sa.from("brands").select("id, name").eq("is_active", true).order("name");
  return (data ?? []) as { id: string; name: string }[];
}

export default async function NewDealerPage() {
  const brands = await getBrands();
  return (
    <CmsShell>
      <h1>Új kereskedő</h1>
      <DealerForm
        mode="create"
        brands={brands}
        hasClaude={HAS_ANTHROPIC}
        hasOpenAI={HAS_OPENAI}
        initial={{
          brand_id: "", name: "", city: "", zip_code: "", street: "",
          lat: "", lng: "", email: "", phone: "", website: "", notes: "",
          is_active: true, sort_order: 0, contacts: [],
        }}
      />
    </CmsShell>
  );
}
