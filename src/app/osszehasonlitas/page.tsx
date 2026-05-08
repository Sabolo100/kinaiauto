import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getModels } from "@/lib/data";
import { CompareApp } from "@/components/compare/compare-app";

export const metadata: Metadata = {
  title: "Összehasonlítás — kínai autók egymás mellett",
  description:
    "Tedd egymás mellé akár 4 kínai modellt: ár, méret, csomagtartó, hatótáv, akku, teljesítmény. A táblázat automatikusan kiemeli az adott sor legjobb értékét.",
  alternates: { canonical: `${SITE_URL}/osszehasonlitas` },
};

export default async function ComparePage() {
  const models = await getModels();
  return (
    <main>
      <section className="pagehead">
        <div className="container">
          <div className="breadcrumbs">
            <Link href="/">Főoldal</Link> · Összehasonlítás
          </div>
          <div className="eyebrow">Maximum 4 modell egymás mellett</div>
          <h1>
            Tedd <em>egymás mellé</em>, és döntsd el.
          </h1>
          <p className="lede">
            Válaszd ki a márkát, modellt és felszereltségi szintet minden
            oszlopban. A táblázat automatikusan kiemeli az alacsonyabb árat,
            nagyobb csomagtartót, hosszabb hatótávot és a többi nyertest.
          </p>
        </div>
      </section>
      <Suspense fallback={<div className="container" style={{ padding: 80 }}>Betöltés…</div>}>
        <CompareApp models={models} />
      </Suspense>

      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Összehasonlítás", url: "/osszehasonlitas" },
        ])}
      />
    </main>
  );
}
