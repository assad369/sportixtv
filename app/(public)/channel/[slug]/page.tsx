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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.sportixtv.online";
  const description = `Watch ${channel.name} live stream online for free in HD. ${channel.description || "Live 24/7 streaming available."}`.slice(0, 160);
  const ogImage = { url: channel.logoUrl, alt: `${channel.name} live stream` };
  return {
    title: `Watch ${channel.name} Live — Free HD Stream`,
    description,
    keywords: [`${channel.name} live`, `${channel.name} stream`, "live tv", "free streaming", "HD"],
    alternates: { canonical: `/channel/${slug}` },
    openGraph: {
      type: "video.other",
      title: `Watch ${channel.name} Live`,
      description,
      url: `${siteUrl}/channel/${slug}`,
      images: [ogImage],
      siteName: "SportixTV",
    },
    twitter: {
      card: "summary_large_image",
      title: `Watch ${channel.name} Live`,
      description,
      images: [ogImage],
    },
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
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {/* Player */}
          <LivePlayer
            channelId={channel.id}
            channelName={channel.name}
            sourceLabels={
              channel.sourceLabels.length > 0
                ? channel.sourceLabels
                : ["Server 1"]
            }
            sourceTypes={
              channel.sourceTypes.length > 0
                ? channel.sourceTypes
                : ["hls"]
            }
            poster={channel.logoUrl}
          />
          <ViewBeacon channelId={channel.id} channelSlug={channel.slug} />

          <AdSlot placement="below_player" className="mt-4" />

          {/* Channel info card */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-surface-2 to-surface">
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0 size-14 overflow-hidden rounded-xl ring-2 ring-white/8">
                  <Image
                    src={channel.logoUrl}
                    alt={`${channel.name} live TV channel`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black tracking-tight">{channel.name}</h1>
                    <LiveBadge />
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink-faint">
                    <EyeIcon className="size-3.5" />
                    {formatViews(channel.viewCount)} views
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {channel.description ||
                      `Watch ${channel.name} live online for free in HD quality. Stream ${channel.name} 24/7 on any device — mobile, tablet, or desktop. No sign-up required.`}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
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
          <div className="mb-4 flex items-center gap-2.5">
            <span className="section-accent" />
            <h2 className="text-lg font-black tracking-tight">More Channels</h2>
          </div>
          <ChannelGrid channels={related} />
        </section>
      )}
    </div>
  );
}
