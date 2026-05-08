import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import {
  articleSchema,
  breadcrumbSchema,
  faqSchema,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/env";
import { getArticleIndex, getDataLastUpdated } from "@/lib/data";
import { TudastarPage } from "@/components/tudastar/tudastar-page";
import { TUDASTAR_FAQ } from "@/components/tudastar/content";

export const metadata: Metadata = {
  title: "Tudástár — kínai autó vásárlás érthetően",
  description:
    "Hajtástípusok, hatótáv, töltés, pénzügy, lízing — a kínai autó vásárláshoz minden gyakorlati tudás egy helyen. Vásárlói útmutató 8 fejezetben.",
  alternates: { canonical: `${SITE_URL}/tudastar` },
};

export default async function TudastarPageRoot() {
  const [index, lastUpdated] = await Promise.all([
    getArticleIndex(),
    getDataLastUpdated(),
  ]);

  return (
    <main>
      <TudastarPage articleIndex={index} lastUpdated={lastUpdated} />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Főoldal", url: "/" },
          { name: "Tudástár", url: "/tudastar" },
        ])}
      />
      <JsonLd
        data={articleSchema({
          title: "Kínai autók vásárlása érthetően",
          description:
            "Vásárlói útmutató: hajtástípusok, hatótáv, töltés, adózás, lízing.",
          url: `${SITE_URL}/tudastar`,
        })}
      />
      <JsonLd data={faqSchema(TUDASTAR_FAQ)} />
    </main>
  );
}
