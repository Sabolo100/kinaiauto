// Landing on /modellek with no brand/model selected used to show an empty area
// below the brand strip. Instead we open a model right away so the page always
// has something to look at. The pick rotates once per day (deterministic within
// the day, so it is cache- and SEO-friendly) — a different model each day.
export const revalidate = 300;

import { redirect } from "next/navigation";
import { getModels } from "@/lib/data";

export default async function ModelsBrowseRoot() {
  const models = await getModels();

  if (models.length > 0) {
    // Day index since epoch → hashed for a pseudo-random (but stable-per-day) pick.
    const day = Math.floor(Date.now() / 86_400_000);
    const idx = ((day * 2654435761) >>> 0) % models.length;
    const m = models[idx];
    redirect(`/modellek/${m.brand_slug}/${m.slug}`);
  }

  // No models at all — render nothing meaningful (the layout strip still shows).
  return null;
}
