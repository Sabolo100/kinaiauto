export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getBrands } from "@/lib/data";

export default async function BrandsIndex() {
  const brands = await getBrands();
  // Default to BYD (or first), preserving the prototype's behaviour
  const target = brands.find((b) => b.slug === "byd") ?? brands[0];
  if (target) redirect(`/markak/${target.slug}`);
  redirect("/");
}
