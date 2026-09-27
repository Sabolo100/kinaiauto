import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { articleSchema, breadcrumbSchema, faqSchema, pageMeta } from "@/lib/seo";
import { getArticleIndex, getDataLastUpdated } from "@/lib/data";
import { TudastarPage } from "@/components/tudastar/tudastar-page";
import { TUDASTAR_FAQ, TUDASTAR_UPDATED } from "@/components/tudastar/content";

const TITLE = "Tudástár — kínai autó vásárlás érthetően";
const DESCRIPTION =
  "Hajtástípusok, valós hatótáv, otthoni és nyilvános töltés, cégautóadó, illeték, lízing: vásárlói útmutató kínai autókhoz Magyarországon, gyakori kérdésekkel.";

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/tudastar", type: "article" });

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
          description: DESCRIPTION,
          url: "/tudastar",
          dateModified: TUDASTAR_UPDATED,
        })}
      />
      <JsonLd data={faqSchema(TUDASTAR_FAQ)} />
    </main>
  );
}
