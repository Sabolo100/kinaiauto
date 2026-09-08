export const dynamic = "force-dynamic";
import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { DealerImport } from "@/components/cms/dealer-import";
import { db } from "@/lib/db";

async function getBrands() {
  return db()<{ id: string; name: string; slug: string }[]>`select id, name, slug from brands order by sort_order`;
}

export default async function DealerImportPage() {
  const brands = await getBrands();
  return (
    <CmsShell>
      <div className="cms-toolbar">
        <h1 style={{ margin: 0 }}>Kereskedők importálása</h1>
        <div style={{ flex: 1 }} />
        <Link className="cms-btn ghost" href="/c4m5s6/kereskedok">
          ← Vissza a listára
        </Link>
      </div>
      <DealerImport brands={brands} />
    </CmsShell>
  );
}
