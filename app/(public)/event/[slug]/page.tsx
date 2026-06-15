import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data/events";
import { getChannelBySlug } from "@/lib/data/channels";
import type { ChannelLite } from "@/lib/data/channels";
import { EventWatch } from "@/components/events/EventWatch";
import { JsonLd } from "@/components/seo/JsonLd";
import { eventJsonLd } from "@/lib/seo/jsonld";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const hasTeams = event.teamA && event.teamB;
  const title = hasTeams
    ? `${event.teamA!.name} vs ${event.teamB!.name} Live${event.league ? ` – ${event.league}` : ""}`
    : `${event.title} Live`;
  const description = `Watch ${event.title} live online for free in HD. ${event.league ?? event.sport} live streaming on SportixTV.`.slice(0, 160);
  const ogImage = hasTeams && event.teamA!.logoUrl
    ? { url: event.teamA!.logoUrl, alt: title }
    : undefined;
  return {
    title,
    description,
    keywords: [event.title, event.sport, event.league ?? "", "live match", "watch online", "free streaming"].filter(Boolean),
    alternates: { canonical: `/event/${slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteUrl}/event/${slug}`,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const channels = (
    await Promise.all(event.channels.map((c) => getChannelBySlug(c.slug)))
  ).filter((c): c is ChannelLite => c !== null);

  return (
    <>
      <JsonLd data={eventJsonLd(event)} />
      <EventWatch event={event} channels={channels} />
    </>
  );
}
