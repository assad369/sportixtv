import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getChannelBySlug, getRelatedChannels } from "@/lib/data/channels";
import { ChannelGrid } from "@/components/channels/ChannelGrid";
import { LivePlayer } from "@/components/player/LivePlayer";
import { ViewBeacon } from "@/components/player/ViewBeacon";
import { ReportButton } from "@/components/player/ReportButton";
import { ShareButtons } from "@/components/player/ShareButtons";
import { FavoriteButton } from "@/components/channels/FavoriteButton";
import { AdSlot } from "@/components/ads/AdSlot";
import { JsonLd } from "@/components/seo/JsonLd";
import { channelJsonLd } from "@/lib/seo/jsonld";
import { getSettings } from "@/lib/data/settings";
import { EyeIcon } from "@/components/icons";
import { LiveBadge } from "@/components/ui/Badge";
import { formatViews } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) return {};
  return {
    title: `Watch ${channel.name} Live`,
    description: `Watch ${channel.name} live stream online for free in HD. ${channel.description}`.slice(
      0,
      160,
    ),
    alternates: { canonical: `/channel/${slug}` },
  };
}

export default async function ChannelPage({ params }: Props) {
  const { slug } = await params;
  const channel = await getChannelBySlug(slug);
  if (!channel) notFound();

  const [related, settings] = await Promise.all([
    getRelatedChannels(channel.categoryId, slug),
    getSettings(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <JsonLd data={channelJsonLd(channel, settings)} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <LivePlayer
            channelId={channel.id}
            channelName={channel.name}
            sourceLabels={
              channel.sourceLabels.length > 0
                ? channel.sourceLabels
                : ["Server 1"]
            }
            poster={channel.logoUrl}
          />
          <ViewBeacon channelId={channel.id} channelSlug={channel.slug} />

          <AdSlot placement="below_player" className="mt-4" />

          <div className="mt-4 flex items-start gap-4">
            <Image
              src={channel.logoUrl}
              alt={`${channel.name} logo`}
              width={56}
              height={56}
              className="size-14 rounded-xl bg-surface-2 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{channel.name}</h1>
                <LiveBadge />
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-faint">
                <EyeIcon className="size-3.5" />
                {formatViews(channel.viewCount)} views
              </p>
              {channel.description && (
                <p className="mt-2 text-sm text-ink-muted">
                  {channel.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <FavoriteButton channelSlug={channel.slug} />
                <ShareButtons title={`Watch ${channel.name} Live`} />
                <ReportButton channelId={channel.id} />
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden lg:block" aria-label="Sidebar">
          <AdSlot placement="sidebar" className="flex flex-col gap-4" />
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-label="Related channels">
          <h2 className="mb-3 text-lg font-bold">More Channels</h2>
          <ChannelGrid channels={related} />
        </section>
      )}
    </div>
  );
}
