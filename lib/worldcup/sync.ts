import { ObjectId, type Collection, type Db } from "mongodb";
import type { EventDoc, EventTeam } from "@/lib/db/schemas/event";
import type { SiteSettings } from "@/lib/db/schemas/settings";
import { slugify } from "@/lib/utils";
import { WORLD_CUP_FIXTURES, fixtureTitle } from "./schedule";
import { flagUrl } from "./flags";

/**
 * Idempotent upsert of the static World Cup 2026 schedule into the `events`
 * collection. Takes a raw `Db` (not the server-only collection helpers) so the
 * same code runs from server actions, the cron route, AND the `tsx` seed script.
 *
 * "Manual override wins": any field an admin pinned via the event editor
 * (`lockedFields`, see lib/sync/transform) is never overwritten by a re-sync.
 * Cache invalidation is the caller's job (updateTag in actions, revalidateTag in
 * route handlers) — this module stays free of next/cache so the seed can import it.
 */

export const WC_SOURCE = "worldcup2026";
export const WC_LEAGUE = "FIFA World Cup 2026";
/** Live window: an event drops off live surfaces this long after kickoff. */
export const WC_MATCH_DURATION_MS = 3 * 60 * 60 * 1000;

export interface WorldCupSyncResult {
  created: number;
  updated: number;
  total: number;
}

function teamOf(name: string | null): EventTeam | undefined {
  if (!name) return undefined;
  const logoUrl = flagUrl(name);
  return logoUrl ? { name, logoUrl } : { name };
}

async function resolveDefaultChannelIds(
  db: Db,
  explicit: string | null | undefined,
): Promise<ObjectId[]> {
  let id = explicit;
  if (id === undefined) {
    const s = await db
      .collection<SiteSettings>("settings")
      .findOne({ _id: "site" });
    id = s?.worldCupDefaultChannelId ?? null;
  }
  return id && ObjectId.isValid(id) ? [new ObjectId(id)] : [];
}

async function uniqueSlug(
  col: Collection<EventDoc>,
  base: string,
  startsAt: Date,
  id: string,
): Promise<string> {
  const root = base || `wc2026-${id}`;
  if (!(await col.findOne({ slug: root }))) return root;
  const dated = `${root}-${startsAt.toISOString().slice(0, 10)}`;
  if (!(await col.findOne({ slug: dated }))) return dated;
  return `${root}-${id}`;
}

/**
 * Create/refresh every World Cup fixture. `defaultChannelId` overrides the
 * stored setting when provided (the cron/seed paths pass it explicitly).
 */
export async function syncWorldCupFixtures(
  db: Db,
  opts: { defaultChannelId?: string | null } = {},
): Promise<WorldCupSyncResult> {
  const events = db.collection<EventDoc>("events");
  const defaultChannelIds = await resolveDefaultChannelIds(
    db,
    opts.defaultChannelId,
  );
  const now = new Date();
  let created = 0;
  let updated = 0;

  for (const f of WORLD_CUP_FIXTURES) {
    const externalRef = `${WC_SOURCE}:${f.id}`;
    const startsAt = new Date(f.kickoffEt);
    const endsAt = new Date(startsAt.getTime() + WC_MATCH_DURATION_MS);
    const title = fixtureTitle(f);
    const teamA = teamOf(f.home);
    const teamB = teamOf(f.away);

    const existing = await events.findOne({ externalRef });

    if (!existing) {
      const slug = await uniqueSlug(events, slugify(title), startsAt, f.id);
      await events.insertOne({
        _id: new ObjectId(),
        title,
        slug,
        sport: "football",
        league: WC_LEAGUE,
        teamA,
        teamB,
        startsAt,
        endsAt,
        venue: f.venue,
        forcedStatus: null,
        channelIds: defaultChannelIds,
        isFeatured: false,
        source: WC_SOURCE,
        externalId: f.id,
        externalRef,
        syncManaged: true,
        lockedFields: [],
        createdAt: now,
        updatedAt: now,
        lastSyncedAt: now,
      });
      created += 1;
      continue;
    }

    // Update path — lock-aware so manual edits survive a re-sync.
    const locked = new Set(existing.lockedFields ?? []);
    const set: Record<string, unknown> = {
      venue: f.venue, // not admin-editable → always refreshed
      updatedAt: now,
      lastSyncedAt: now,
    };
    if (!locked.has("title")) set.title = title;
    if (!locked.has("sport")) set.sport = "football";
    if (!locked.has("league")) set.league = WC_LEAGUE;
    if (!locked.has("teamA")) set.teamA = teamA;
    if (!locked.has("teamB")) set.teamB = teamB;
    if (!locked.has("startsAt")) set.startsAt = startsAt;
    if (!locked.has("endsAt")) set.endsAt = endsAt;
    // Keep the link aligned with the current default, but never wipe links when
    // no default is configured, and never override a per-match (locked) choice.
    if (!locked.has("channelIds") && defaultChannelIds.length > 0) {
      set.channelIds = defaultChannelIds;
    }
    await events.updateOne({ _id: existing._id }, { $set: set });
    updated += 1;
  }

  return { created, updated, total: WORLD_CUP_FIXTURES.length };
}

/**
 * Re-link every World Cup event (except those whose channel an admin pinned) to
 * the given default channel. Pass null/"" to clear. Returns docs changed.
 */
export async function relinkWorldCupDefaultChannel(
  db: Db,
  channelId: string | null,
): Promise<number> {
  const events = db.collection<EventDoc>("events");
  const ids =
    channelId && ObjectId.isValid(channelId) ? [new ObjectId(channelId)] : [];
  const res = await events.updateMany(
    { source: WC_SOURCE, lockedFields: { $ne: "channelIds" } },
    { $set: { channelIds: ids, updatedAt: new Date() } },
  );
  return res.modifiedCount;
}
