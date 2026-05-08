// /llms.txt — short description + index.
// Follows the proposed convention at https://llmstxt.org

import { getArticleIndex, getBrands, getModels } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const [brands, models, articles] = await Promise.all([
    getBrands(),
    getModels(),
    getArticleIndex(),
  ]);

  const lines: string[] = [];
  lines.push("# kinaiauto.com");
  lines.push("");
  lines.push(
    "> Független magyar nyelvű kínai autó-iránytű. Kategória, ársáv és hajtás alapján szűrhető teljes hazai kínálat — modellkereső, vizuális összehasonlítás, márka-háttér és vásárlói tudástár.",
  );
  lines.push("");
  lines.push(`Site: ${SITE_URL}`);
  lines.push(`Locale: hu-HU`);
  lines.push(`Topic: kínai autó vásárlás Magyarországon, BYD, Chery, MG, NIO, XPENG, Leapmotor és további márkák.`);
  lines.push("");
  lines.push("## Főbb oldalak");
  lines.push("");
  lines.push(`- [Főoldal](${SITE_URL}/): modellkereső kategória, ársáv és hajtásmód alapján, vizuális kínálat-számegyenes`);
  lines.push(`- [Kínálat](${SITE_URL}/kinalat): függőleges hasáb-vizualizáció, a modellek arányosan helyezkednek el ár/hatótáv/csomagtartó stb. szerint`);
  lines.push(`- [Összehasonlítás](${SITE_URL}/osszehasonlitas): max. 4 modell egymás mellett, automatikus legjobb-érték kiemelés`);
  lines.push(`- [Márkák](${SITE_URL}/markak): a magyar piacon kapható ${brands.length} kínai márka modelljei és háttér-adatai`);
  lines.push(`- [Modellek](${SITE_URL}/modellek): ${models.length} modell részletes adatlapja, brand+model deep-link szabványos URL-en`);
  lines.push(`- [Tudástár](${SITE_URL}/tudastar): hajtástípusok, hatótáv, töltés, adózás, lízing — vásárlói útmutató`);
  lines.push("");
  lines.push("## Márkák");
  lines.push("");
  for (const b of brands) {
    lines.push(`- [${b.name}](${SITE_URL}/markak/${b.slug}): ${b.tagline ?? ""}`);
  }
  lines.push("");
  lines.push("## Tudástár cikkek");
  lines.push("");
  for (const a of articles) {
    lines.push(`- [${a.title}](${SITE_URL}/tudastar/${a.slug}): ${a.excerpt}`);
  }
  lines.push("");
  lines.push(
    `For full content: ${SITE_URL}/llms-full.txt (or use the structured JSON-LD on every page: Vehicle, Organization, BreadcrumbList, FAQPage).`,
  );
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
