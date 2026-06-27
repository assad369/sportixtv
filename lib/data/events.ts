import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { channels, events } from "@/lib/db/collections";
import { CHANNEL_PUBLIC_PROJECTION } from "@/lib/db/schemas/channel";
import type { EventDoc, EventTeam } from "@/lib/db/schemas/event";
import type { EventStatus } from "@/lib/utils";
import { safeQuery } from "./safe";

/**
 * Client-safe event shape. Live/upcoming/ended status is derived from these
 * dates on the client (or per-request) — never inside the cached scope, so
 * cached output stays clock-independent.
 */
export interface EventLite {
  id: string;
  title: string;
  slug: string;
  sport: string;
  league?: string;
  teamA?: EventTeam;
  teamB?: EventTeam;
  startsAt: string; // ISO
  endsAt: string | null; // ISO
  venue?: string;
  forcedStatus: EventStatus | null;
  isFeatured: boolean;
  channels: { slug: string; name: string; logoUrl: string }[];
}

export async function toLite(doc: EventDoc): Promise<EventLite> {
  const chCol = await channels();
  const chDocs = doc.channelIds.length
    ? await chCol
        .find(
          { _id: { $in: doc.channelIds }, isActive: true },
          { projection: CHANNEL_PUBLIC_PROJECTION },
        )
        .toArray()
    : [];
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    slug: doc.slug,
    sport: doc.sport,
    league: doc.league,
    teamA: doc.teamA,
    teamB: doc.teamB,
    startsAt: doc.startsAt.toISOString(),
    endsAt: doc.endsAt ? doc.endsAt.toISOString() : null,
    venue: doc.venue,
    forcedStatus: doc.forcedStatus ?? null,
    isFeatured: doc.isFeatured,
    channels: chDocs.map((c) => ({
      slug: c.slug,
      name: c.name,
      logoUrl: c.logoUrl,
    })),
  };
}

/**
 * Recent + upcoming events (last 2 days back, anything in the future). The
 * lower bound is day-granular so the cached output stays stable within a day
 * (clock-independent), and keeps the result from being swamped by long-finished
 * fixtures — e.g. the 100+ World Cup group games — pushing live ones past the limit.
 */
export async function getRecentAndUpcomingEvents(): Promise<EventLite[]> {
  "use cache";
  cacheTag("events");
  cacheLife("minutes");
  return safeQuery([], async () => {
    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - 2);
    const col = await events();
    const docs = await col
      .find({ startsAt: { $gte: since } })
      .sort({ startsAt: 1 })
      .limit(200)
      .toArray();
    return Promise.all(docs.map(toLite));
  });
}

export async function getEventBySlug(slug: string): Promise<EventLite | null> {
  "use cache";
  cacheTag("events", `event:${slug}`);
  cacheLife("minutes");
  return safeQuery(null, async () => {
    const col = await events();
    const doc = await col.findOne({ slug });
    return doc ? toLite(doc) : null;
  });
}
