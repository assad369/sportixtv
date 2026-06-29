import { ObjectId, type Db } from "mongodb";
import type { EventDoc } from "@/lib/db/schemas/event";
import type { SiteSettings } from "@/lib/db/schemas/settings";
import { ICC_SOURCE } from "@/lib/sync/adapters/icc";

/**
 * Apply gender-based default channels to ICC events that have no admin-locked
 * channelIds. Called after runSync() in the ICC cron route so that newly-
 * created events pick up the site-level defaults even though the generic engine
 * only knows about LeagueChannelMap rules.
 *
 * "Manual override wins": any event where an admin has locked channelIds is
 * left untouched (lockedFields includes "channelIds").
 *
 * Mirrors relinkWorldCupDefaultChannel() in lib/worldcup/sync.ts.
 */
export async function applyIccDefaultChannels(db: Db): Promise<number> {
  const settingsCol = db.collection<SiteSettings>("settings");
  const s = await settingsCol.findOne({ _id: "site" });
  if (!s) return 0;

  const menIds = toObjectIds(s.iccMenDefaultChannelIds ?? []);
  const womenIds = toObjectIds(s.iccWomenDefaultChannelIds ?? []);
  if (!menIds.length && !womenIds.length) return 0;

  const eventsCol = db.collection<EventDoc>("events");
  const iccEvents = await eventsCol
    .find({
      source: ICC_SOURCE,
      // Only update events the admin has not manually pinned channels on.
      lockedFields: { $ne: "channelIds" },
      // Only update events with empty channelIds (don't override existing assignments).
      channelIds: { $size: 0 },
    })
    .project<Pick<EventDoc, "_id" | "league">>({ _id: 1, league: 1 })
    .toArray();

  if (!iccEvents.length) return 0;

  const now = new Date();
  let modified = 0;

  for (const ev of iccEvents) {
    const league = (ev.league ?? "").toLowerCase();
    const isWomen = league.includes("women");
    const channelIds = isWomen ? womenIds : menIds;
    if (!channelIds.length) continue;

    await eventsCol.updateOne(
      { _id: ev._id },
      { $set: { channelIds, updatedAt: now } },
    );
    modified++;
  }

  return modified;
}

/**
 * Re-link ALL ICC events (except admin-locked ones) to the current defaults.
 * Call this when the admin changes the default channels in the ICC settings.
 */
export async function relinkIccDefaultChannels(db: Db): Promise<number> {
  const settingsCol = db.collection<SiteSettings>("settings");
  const s = await settingsCol.findOne({ _id: "site" });
  if (!s) return 0;

  const menIds = toObjectIds(s.iccMenDefaultChannelIds ?? []);
  const womenIds = toObjectIds(s.iccWomenDefaultChannelIds ?? []);

  const eventsCol = db.collection<EventDoc>("events");
  const iccEvents = await eventsCol
    .find({
      source: ICC_SOURCE,
      lockedFields: { $ne: "channelIds" },
    })
    .project<Pick<EventDoc, "_id" | "league">>({ _id: 1, league: 1 })
    .toArray();

  if (!iccEvents.length) return 0;

  const now = new Date();
  let modified = 0;

  for (const ev of iccEvents) {
    const league = (ev.league ?? "").toLowerCase();
    const isWomen = league.includes("women");
    const channelIds = isWomen ? womenIds : menIds;

    await eventsCol.updateOne(
      { _id: ev._id },
      { $set: { channelIds, updatedAt: now } },
    );
    modified++;
  }

  return modified;
}

function toObjectIds(hexIds: string[]): ObjectId[] {
  return hexIds
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
}
