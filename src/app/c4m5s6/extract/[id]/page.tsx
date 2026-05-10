import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { ExtractReview } from "@/components/cms/extract-review";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ExtractDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sa = supabaseAdmin();
  const ex = await sa
    .from("model_extractions")
    .select("*, model:models(*, brand:brands(name,slug))")
    .eq("id", id)
    .single();
  if (ex.error || !ex.data) return notFound();

  return (
    <CmsShell>
      <h1>Kinyerés #{id.slice(0, 8)}</h1>
      <ExtractReview extraction={ex.data} />
    </CmsShell>
  );
}
