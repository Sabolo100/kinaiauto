import Link from "next/link";
import { CmsShell } from "@/components/cms/cms-shell";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function getStats() {
  const sa = supabaseAdmin();
  const [brands, models, photos, pending] = await Promise.all([
    sa.from("brands").select("id", { count: "exact", head: true }).is("archived_at", null),
    sa.from("models").select("id", { count: "exact", head: true }).is("archived_at", null),
    sa.from("model_photos").select("id", { count: "exact", head: true }),
    sa.from("model_extractions").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return {
    brands: brands.count ?? 0,
    models: models.count ?? 0,
    photos: photos.count ?? 0,
    pending: pending.count ?? 0,
  };
}

export default async function CmsHome() {
  const stats = await getStats();
  return (
    <CmsShell>
      <h1>Áttekintés</h1>
      <p className="lede">
        Manuális szerkesztés a Márkák / Modellek menüből. PDF vagy URL alapú
        adatkinyerés a Kinyerés fülön — a kinyert adatok jóváhagyásra várnak,
        nem érintik a nyilvános site-ot, amíg jóvá nem hagyod.
      </p>

      <div className="cms-grid-cards">
        <Link href="/c4m5s6/markak" className="cms-stat">
          <div className="num">{stats.brands}</div>
          <div className="lab">Aktív márka</div>
        </Link>
        <Link href="/c4m5s6/modellek" className="cms-stat">
          <div className="num">{stats.models}</div>
          <div className="lab">Aktív modell</div>
        </Link>
        <Link href="/c4m5s6/modellek" className="cms-stat">
          <div className="num">{stats.photos}</div>
          <div className="lab">Feltöltött fotó</div>
        </Link>
        <Link href="/c4m5s6/extract" className="cms-stat">
          <div className="num">{stats.pending}</div>
          <div className="lab">Jóváhagyásra váró kinyerés</div>
        </Link>
      </div>

      <h2>Gyors műveletek</h2>
      <div className="cms-actions">
        <Link className="cms-btn primary" href="/c4m5s6/markak/uj">
          + Új márka
        </Link>
        <Link className="cms-btn primary" href="/c4m5s6/modellek/uj">
          + Új modell
        </Link>
        <Link className="cms-btn ghost" href="/c4m5s6/extract">
          PDF / URL kinyerés
        </Link>
      </div>
    </CmsShell>
  );
}
