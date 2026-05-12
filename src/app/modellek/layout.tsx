// This layout wraps ALL /modellek/** routes.
// The pagehead and brand/model strip are rendered here so they
// persist across navigations between /modellek and /modellek/[brand]/[model]
// — the header stays visible while only the model detail area changes.
export const dynamic = "force-dynamic";

import Link from "next/link";
import { getBrands, getModels } from "@/lib/data";
import { ModelsBrowserStrip } from "@/components/model-detail/models-browser";

export default async function ModellekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [brands, models] = await Promise.all([getBrands(), getModels()]);

  return (
    <main>
      {/* Persistent heading — always visible regardless of which model is open */}
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · Modellek
          </div>
          <div className="eyebrow">
            Modell-kereső · {models.length} modell · {brands.length} márka
          </div>
          <h1>
            Válassz <em>márkát</em>, majd modellt.
          </h1>
          <p className="lede">
            Felül a márka, alatta a választott márka modelljei. Bármelyik
            modellre kattintva a teljes adatlap megnyílik.
          </p>
        </div>
      </section>

      {/* Persistent brand + model selector */}
      <ModelsBrowserStrip brands={brands} models={models} />

      {/* Page-specific content (empty on /modellek, ModelDetail on /modellek/[brand]/[model]) */}
      {children}
    </main>
  );
}
