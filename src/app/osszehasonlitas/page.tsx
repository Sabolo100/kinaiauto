export const revalidate = 300;

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, pageMeta, webPageSchema } from "@/lib/seo";
import { getModels } from "@/lib/data";
import { CompareApp } from "@/components/compare/compare-app";

const TITLE = "Kínai autók összehasonlítása egymás mellett";
const DESCRIPTION =
  "Tegyél egymás mellé akár 4 kínai autót: ár, méret, csomagtartó, hatótáv, akkumulátor, teljesítmény. A táblázat soronként kiemeli a legjobb értéket.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/osszehasonlitas" });

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
        data={webPageSchema({ path: "/osszehasonlitas", name: TITLE, description: DESCRIPTION })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Összehasonlítás", url: "/osszehasonlitas" },
        ])}
      />
    </main>
  );
}
