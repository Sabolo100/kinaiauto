import "server-only";
import { db } from "./db";

export async function getLookups() {
  const sql = db();
  const [brands, categories, drives] = await Promise.all([
    sql<{ id: string; name: string }[]>`select id, name from brands order by sort_order asc`,
    sql<{ id: number; slug: string; label_hu: string }[]>`select id, slug, label_hu from categories order by sort_order asc`,
    sql<{ id: number; label_hu: string }[]>`select id, label_hu from drives order by sort_order asc`,
  ]);
  return { brands, categories, drives };
}
