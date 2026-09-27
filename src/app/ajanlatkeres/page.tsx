export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { getBrands, getAllDealers, getModels } from "@/lib/data";
import { getSetting } from "@/lib/settings";
import { QuotePage } from "@/components/quote/quote-page";

export const metadata: Metadata = pageMeta({
  title: "Ajánlatkérés",
  description: "Kiválasztott kínai modellek listája — egy kattintással kérhetsz ajánlatot több márkakereskedőtől egyszerre.",
  path: "/ajanlatkeres",
  noindexNofollow: true,
});

export default async function AjanlatkeresPage() {
  const [brands, dealers, models, maxDealersStr] = await Promise.all([
    getBrands(),
    getAllDealers(),
    getModels(),
    getSetting("quote_max_dealers_per_brand", "3"),
  ]);
  const maxDealersPerBrand = Math.max(1, parseInt(maxDealersStr, 10) || 3);
  return (
    <QuotePage
      brands={brands}
      dealers={dealers}
      models={models}
      maxDealersPerBrand={maxDealersPerBrand}
    />
  );
}
