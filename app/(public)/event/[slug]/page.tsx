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
  const title =
    event.teamA && event.teamB
      ? `${event.teamA.name} vs ${event.teamB.name} Live${event.league ? ` – ${event.league}` : ""}`
      : `${event.title} Live`;
  return {
    title,
    description: `Watch ${event.title} live online for free in HD. ${event.league ?? event.sport} live streaming.`,
    alternates: { canonical: `/event/${slug}` },
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
