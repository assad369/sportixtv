import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { categories } from "@/lib/db/collections";
import { safeQuery } from "./safe";

export interface CategoryLite {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export async function getCategories(): Promise<CategoryLite[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("days");
  return safeQuery([], async () => {
    const col = await categories();
    const docs = await col
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray();
    return docs.map((c) => ({
      id: c._id.toHexString(),
      name: c.name,
      slug: c.slug,
      icon: c.icon,
    }));
  });
}

export async function getCategoryBySlug(
  slug: string,
): Promise<CategoryLite | null> {
  "use cache";
  cacheTag("categories");
  cacheLife("days");
  return safeQuery(null, async () => {
    const col = await categories();
    const c = await col.findOne({ slug, isActive: true });
    if (!c) return null;
    return { id: c._id.toHexString(), name: c.name, slug: c.slug, icon: c.icon };
  });
}
