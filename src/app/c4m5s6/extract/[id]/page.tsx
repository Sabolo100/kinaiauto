import type { ComponentProps } from "react";
import { notFound } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { ExtractReview } from "@/components/cms/extract-review";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Extraction = ComponentProps<typeof ExtractReview>["extraction"];

export default async function ExtractDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Nested embed model{*, brand{name,slug}}: to_jsonb(m) = models(*), null if unattached.
  const [ex] = await db()<Record<string, unknown>[]>`
    select e.*,
      case when m.id is null then null else
        to_jsonb(m) || jsonb_build_object(
          'brand', case when b.id is null then null else jsonb_build_object('name', b.name, 'slug', b.slug) end)
      end as model
    from model_extractions e
    left join models m on m.id = e.model_id
    left join brands b on b.id = m.brand_id
    where e.id = ${id}`;
  if (!ex) return notFound();

  return (
    <CmsShell>
      <h1>Kinyerés #{id.slice(0, 8)}</h1>
      <ExtractReview extraction={ex as unknown as Extraction} />
    </CmsShell>
  );
}
