import Link from "next/link";
import { getCategories } from "@/lib/data/categories";
import {
  getFeaturedChannels,
  getChannelsByCategoryId,
  getTrendingChannels,
} from "@/lib/data/channels";
import { ChannelGrid } from "@/components/channels/ChannelGrid";
import { CategoryChips } from "@/components/channels/CategoryChips";
import { LiveNowStrip } from "@/components/events/LiveNowStrip";
import { AdSlot } from "@/components/ads/AdSlot";
import { ChevronRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/seo/JsonLd";
import { websiteJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/data/settings";

async function CategorySection({
  categoryId,
  name,
  slug,
  icon,
}: {
  categoryId: string;
  name: string;
  slug: string;
  icon: string;
}) {
  const channels = await getChannelsByCategoryId(categoryId, 12);
  if (channels.length === 0) return null;
  return (
    <section aria-label={name}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {icon} {name}
        </h2>
        <Link
          href={`/category/${slug}`}
          className="flex items-center gap-0.5 text-sm text-brand hover:underline"
        >
          View all <ChevronRightIcon className="size-4" />
        </Link>
      </div>
      <ChannelGrid channels={channels} />
    </section>
  );
}

export default async function HomePage() {
  const [categories, featured, trending, settings] = await Promise.all([
    getCategories(),
    getFeaturedChannels(),
    getTrendingChannels(),
    getSettings(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={websiteJsonLd(settings)} />
      <h1 className="sr-only">Watch Live Sports & TV Channels Online</h1>

      <LiveNowStrip />

      <CategoryChips categories={categories} />

      {featured.length > 0 && (
        <section aria-label="Featured channels">
          <h2 className="mb-3 text-lg font-bold">⭐ Featured Channels</h2>
          <ChannelGrid channels={featured} />
        </section>
      )}

      {trending.length > 0 && (
        <section aria-label="Trending channels">
          <h2 className="mb-3 text-lg font-bold">🔥 Trending Now</h2>
          <ChannelGrid channels={trending} />
        </section>
      )}

      <AdSlot placement="between_grid" />

      {categories.map((c) => (
        <CategorySection
          key={c.id}
          categoryId={c.id}
          name={c.name}
          slug={c.slug}
          icon={c.icon}
        />
      ))}
    </div>
  );
}
