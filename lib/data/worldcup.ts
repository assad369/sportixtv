import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { events } from "@/lib/db/collections";
import { WC_SOURCE } from "@/lib/worldcup/sync";
import { toLite, type EventLite } from "./events";
import { safeQuery } from "./safe";

/**
 * All World Cup 2026 fixtures (upcoming, live AND completed), ordered by
 * kickoff. Unlike the live-surface event queries this deliberately keeps
 * finished matches — the /fixtures page is the full schedule. Live/upcoming/
 * finished status is derived from the dates on the client (clock-independent
 * cache), exactly like EventCard.
 */
export async function getWorldCupFixtures(): Promise<EventLite[]> {
  "use cache";
  cacheTag("events");
  cacheLife("minutes");
  return safeQuery([], async () => {
    const col = await events();
    const docs = await col
      .find({ source: WC_SOURCE })
      .sort({ startsAt: 1 })
      .toArray();
    return Promise.all(docs.map(toLite));
  });
}
