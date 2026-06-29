import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { events } from "@/lib/db/collections";
import { ICC_SOURCE } from "@/lib/sync/adapters/icc";
import { toLite } from "./events";
import { safeQuery } from "./safe";
import type { EventLite } from "./events";

export type IccGender = "men" | "women";
export type IccFormat = "T20I" | "ODI" | "Test";

export interface IccFixturesOptions {
  gender?: IccGender;
  format?: IccFormat;
  /** How many days in the past to include (default: 1). */
  daysBack?: number;
  /** How many days into the future to include (default: 90). */
  daysAhead?: number;
}

/**
 * Fetch ICC cricket fixtures from the events collection, cached with the
 * "events" tag so the cron sync invalidates the public page automatically.
 */
export async function getIccFixtures(
  opts: IccFixturesOptions = {},
): Promise<EventLite[]> {
  "use cache";
  cacheTag("events");
  cacheLife("hours");

  return safeQuery([], async () => {
    const { gender, format, daysBack = 1, daysAhead = 90 } = opts;

    const windowStart = new Date(Date.now() - daysBack * 86_400_000);
    windowStart.setUTCHours(0, 0, 0, 0);
    const windowEnd = new Date(Date.now() + daysAhead * 86_400_000);

    const query: Record<string, unknown> = {
      source: ICC_SOURCE,
      startsAt: { $gte: windowStart, $lte: windowEnd },
    };

    // Gender filter: ICC tournament names naturally start with "ICC Men's" or "ICC Women's".
    if (gender === "men") {
      query.league = { $regex: /ICC\s+Men's/i };
    } else if (gender === "women") {
      query.league = { $regex: /ICC\s+Women's/i };
    }

    // Format filter: tournament names contain the format code (T20I, ODI, Test).
    if (format) {
      const existing = query.league as { $regex?: RegExp } | undefined;
      if (existing && existing.$regex) {
        // Combine both conditions with $and.
        query.$and = [
          { league: existing },
          { league: { $regex: new RegExp(format, "i") } },
        ];
        delete query.league;
      } else {
        query.league = { $regex: new RegExp(format, "i") };
      }
    }

    const col = await events();
    const docs = await col
      .find(query)
      .sort({ startsAt: 1 })
      .limit(500)
      .toArray();

    return Promise.all(docs.map(toLite));
  });
}

/**
 * Count of ICC fixtures by gender for display in admin and public pages.
 */
export async function getIccFixtureCounts(): Promise<{
  men: number;
  women: number;
  total: number;
}> {
  "use cache";
  cacheTag("events");
  cacheLife("hours");

  return safeQuery({ men: 0, women: 0, total: 0 }, async () => {
    const windowStart = new Date(Date.now() - 86_400_000);
    const windowEnd = new Date(Date.now() + 90 * 86_400_000);
    const col = await events();

    const [men, women] = await Promise.all([
      col.countDocuments({
        source: ICC_SOURCE,
        startsAt: { $gte: windowStart, $lte: windowEnd },
        league: { $regex: /ICC\s+Men's/i },
      }),
      col.countDocuments({
        source: ICC_SOURCE,
        startsAt: { $gte: windowStart, $lte: windowEnd },
        league: { $regex: /ICC\s+Women's/i },
      }),
    ]);

    return { men, women, total: men + women };
  });
}
