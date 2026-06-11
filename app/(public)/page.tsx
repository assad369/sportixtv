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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight">
          <span className="section-accent" />
          {icon} {name}
        </h2>
        <Link
          href={`/category/${slug}`}
          className="flex items-center gap-1 rounded-xl border border-white/5 px-3 py-1.5 text-xs font-semibold text-ink-muted transition-all hover:border-brand/30 hover:text-brand"
        >
          View all <ChevronRightIcon className="size-3.5" />
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
    <div className="flex flex-col gap-10">
      <JsonLd data={websiteJsonLd(settings)} />
      <h1 className="sr-only">Watch Live Sports &amp; TV Channels Online</h1>

      {/* Live & Upcoming Events */}
      <LiveNowStrip />

      {/* Category filter chips */}
      <CategoryChips categories={categories} />

      {/* Featured channels */}
      {featured.length > 0 && (
        <section aria-label="Featured channels">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight">
              <span className="section-accent" />
              ⭐ Featured Channels
            </h2>
          </div>
          <ChannelGrid channels={featured} />
        </section>
      )}

      {/* Trending channels */}
      {trending.length > 0 && (
        <section aria-label="Trending channels">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-lg font-black tracking-tight">
              <span className="section-accent" />
              🔥 Trending Now
            </h2>
          </div>
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
