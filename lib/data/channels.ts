import "server-only";
import { ObjectId, type Filter, type Sort } from "mongodb";
import { cacheLife, cacheTag } from "next/cache";
import { channels } from "@/lib/db/collections";
import {
  CHANNEL_PUBLIC_PROJECTION,
  type ChannelDoc,
} from "@/lib/db/schemas/channel";
import { safeQuery } from "./safe";

/** Client-safe channel shape. Never carries source URLs. */
export interface ChannelLite {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  categoryId: string;
  description: string;
  isFeatured: boolean;
  viewCount: number;
  language?: string;
  country?: string;
  /** Labels of active sources, in admin order — for the source switcher UI. */
  sourceLabels: string[];
  /** Types of active sources, parallel to sourceLabels. */
  sourceTypes: ("hls" | "iframe")[];
}

function toLite(doc: Partial<ChannelDoc> & { _id: ObjectId }): ChannelLite {
  return {
    id: doc._id.toHexString(),
    name: doc.name ?? "",
    slug: doc.slug ?? "",
    logoUrl: doc.logoUrl ?? "",
    categoryId: doc.categoryId?.toHexString() ?? "",
    description: doc.description ?? "",
    isFeatured: doc.isFeatured ?? false,
    viewCount: doc.viewCount ?? 0,
    language: doc.language,
    country: doc.country,
    sourceLabels: (doc.sources ?? [])
      .filter((s) => s.active)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.label),
    sourceTypes: (doc.sources ?? [])
      .filter((s) => s.active)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.type ?? "hls"),
  };
}

async function findLite(
  filter: Filter<ChannelDoc>,
  sort: Sort,
  limit = 0,
): Promise<ChannelLite[]> {
  const col = await channels();
  let cursor = col
    .find(filter)
    .project<ChannelDoc>(CHANNEL_PUBLIC_PROJECTION)
    .sort(sort);
  if (limit) cursor = cursor.limit(limit);
  return (await cursor.toArray()).map(toLite);
}

export async function getFeaturedChannels(): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels");
  cacheLife("hours");
  return safeQuery([], () =>
    findLite({ isActive: true, isFeatured: true }, { order: 1 }, 24),
  );
}

export async function getChannelsByCategoryId(
  categoryId: string,
  limit = 0,
): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels");
  cacheLife("hours");
  return safeQuery([], () =>
    findLite(
      { isActive: true, categoryId: new ObjectId(categoryId) },
      { order: 1 },
      limit,
    ),
  );
}

export async function getAllActiveChannels(): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels");
  cacheLife("hours");
  return safeQuery([], () => findLite({ isActive: true }, { order: 1 }));
}

export async function getChannelBySlug(
  slug: string,
): Promise<ChannelLite | null> {
  "use cache";
  cacheTag("channels", `channel:${slug}`);
  cacheLife("hours");
  return safeQuery(null, async () => {
    const col = await channels();
    const doc = await col.findOne(
      { slug, isActive: true },
      { projection: CHANNEL_PUBLIC_PROJECTION },
    );
    return doc ? toLite(doc) : null;
  });
}

export async function getTrendingChannels(limit = 12): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels", "trending");
  cacheLife("hours");
  return safeQuery([], () =>
    findLite({ isActive: true }, { viewCount: -1, order: 1 }, limit),
  );
}

export async function searchChannels(q: string): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels");
  cacheLife("minutes");
  const query = q.trim().slice(0, 64);
  if (!query) return [];
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeQuery([], () =>
    findLite(
      { isActive: true, name: { $regex: escaped, $options: "i" } },
      { viewCount: -1 },
      24,
    ),
  );
}

export async function getChannelsBySlugs(
  slugs: string[],
): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels");
  cacheLife("hours");
  const valid = slugs.filter(Boolean).slice(0, 100);
  if (valid.length === 0) return [];
  const found = await safeQuery([], () =>
    findLite({ isActive: true, slug: { $in: valid } }, { order: 1 }),
  );
  // Preserve caller order (favorites / recently-watched order).
  const bySlug = new Map(found.map((c) => [c.slug, c]));
  return valid
    .map((s) => bySlug.get(s))
    .filter((c): c is ChannelLite => c !== undefined);
}

export async function getRelatedChannels(
  categoryId: string,
  excludeSlug: string,
  limit = 12,
): Promise<ChannelLite[]> {
  "use cache";
  cacheTag("channels");
  cacheLife("hours");
  if (!ObjectId.isValid(categoryId)) return [];
  return safeQuery([], () =>
    findLite(
      {
        isActive: true,
        categoryId: new ObjectId(categoryId),
        slug: { $ne: excludeSlug },
      },
      { order: 1 },
      limit,
    ),
  );
}
