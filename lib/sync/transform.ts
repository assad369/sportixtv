import type { ObjectId } from "mongodb";
import { slugify, type EventStatus } from "@/lib/utils";
import type { EventDoc, EventTeam } from "@/lib/db/schemas/event";

/**
 * Pure transform helpers shared by the sync engine and exercised directly by
 * unit tests. NOTHING here touches the database or imports "server-only", so it
 * can run under `tsx` with no Next.js/Mongo runtime.
 */

/** Editorial fields the sync may write — each is lock-aware. */
export const SYNC_WRITABLE_FIELDS = [
  "title",
  "sport",
  "league",
  "teamA",
  "teamB",
  "startsAt",
  "endsAt",
  "channelIds",
] as const;

export type SyncWritableField = (typeof SYNC_WRITABLE_FIELDS)[number];

export function externalRefOf(source: string, externalId: string): string {
  return `${source}:${externalId}`;
}

/**
 * Cross-provider fingerprint: same physical match from two providers should
 * collapse to one. Built from sport + the two team slugs (order-independent) +
 * the kickoff hour (UTC), which absorbs minor minute-level disagreements.
 */
export function physicalKeyOf(f: {
  sport: string;
  teamA?: { name: string };
  teamB?: { name: string };
  startsAt: Date;
}): string {
  const teams = [f.teamA?.name ?? "", f.teamB?.name ?? ""]
    .map((n) => slugify(n))
    .filter(Boolean)
    .sort();
  const hour = new Date(f.startsAt);
  hour.setUTCMinutes(0, 0, 0);
  return [slugify(f.sport), teams.join("--"), hour.toISOString().slice(0, 13)].join(
    "|",
  );
}

/** The fields a normalized fixture contributes to an EventDoc. */
export interface SyncCandidate {
  title: string;
  sport: string;
  league?: string;
  teamA?: EventTeam;
  teamB?: EventTeam;
  startsAt: Date;
  endsAt?: Date | null;
  channelIds: ObjectId[];
  source: string;
  externalId: string;
  externalRef: string;
  externalUpdatedAt?: Date | null;
  physicalKey: string;
}

export type SyncDecision = "create" | "update" | "skip";

export interface SyncUpdatePlan {
  decision: SyncDecision;
  /** Fields for `$set` (already filtered against lockedFields). */
  set: Record<string, unknown>;
  /** Fields for `$setOnInsert` (create path only; engine adds _id + slug). */
  setOnInsert: Record<string, unknown>;
}

type ExistingForPlan = Pick<
  EventDoc,
  "externalUpdatedAt" | "syncManaged" | "lockedFields"
> | null;

/**
 * Decide what a sync write should do. Enforces "manual override wins":
 *  - unchanged provider payload (same externalUpdatedAt) → skip
 *  - any field in `lockedFields` is dropped from the write
 *  - a pre-existing MANUAL event matched by physicalKey is only *linked*
 *    (provider refs attached), never overwritten editorially
 */
export function buildSyncUpdate(
  existing: ExistingForPlan,
  candidate: SyncCandidate,
  now: Date = new Date(),
): SyncUpdatePlan {
  if (
    existing &&
    candidate.externalUpdatedAt &&
    existing.externalUpdatedAt &&
    candidate.externalUpdatedAt.getTime() === existing.externalUpdatedAt.getTime()
  ) {
    return { decision: "skip", set: {}, setOnInsert: {} };
  }

  const meta: Record<string, unknown> = {
    source: candidate.source,
    externalId: candidate.externalId,
    externalRef: candidate.externalRef,
    externalUpdatedAt: candidate.externalUpdatedAt ?? null,
    physicalKey: candidate.physicalKey,
    lastSyncedAt: now,
    updatedAt: now,
  };

  // Matched a manual event by physicalKey — link only, keep editorial content.
  if (existing && existing.syncManaged !== true) {
    return { decision: "update", set: { ...meta }, setOnInsert: {} };
  }

  const locked = new Set(existing?.lockedFields ?? []);
  const editorialSource: Record<SyncWritableField, unknown> = {
    title: candidate.title,
    sport: candidate.sport,
    league: candidate.league ?? undefined,
    teamA: candidate.teamA,
    teamB: candidate.teamB,
    startsAt: candidate.startsAt,
    endsAt: candidate.endsAt ?? null,
    channelIds: candidate.channelIds,
  };
  const editorial: Record<string, unknown> = {};
  for (const field of SYNC_WRITABLE_FIELDS) {
    if (locked.has(field)) continue;
    editorial[field] = editorialSource[field];
  }

  if (existing) {
    return { decision: "update", set: { ...editorial, ...meta }, setOnInsert: {} };
  }

  return {
    decision: "create",
    set: { ...editorial, ...meta, syncManaged: true },
    setOnInsert: {
      isFeatured: false,
      forcedStatus: null,
      lockedFields: [],
      createdAt: now,
    },
  };
}

/** Minute-precision snapshot of the editorial fields, for change detection. */
export interface EditorialSnapshot {
  title: string;
  sport: string;
  league: string;
  teamA: string;
  teamB: string;
  startsAtMin: number;
  endsAtMin: number | null;
  channelIds: string[];
}

function teamKey(t?: { name?: string; logoUrl?: string } | null): string {
  if (!t || !t.name) return "";
  return `${t.name}|${t.logoUrl ?? ""}`;
}

function toMinute(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor(t / 60000);
}

export function snapshotEditorial(e: {
  title: string;
  sport: string;
  league?: string | null;
  teamA?: { name?: string; logoUrl?: string } | null;
  teamB?: { name?: string; logoUrl?: string } | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  channelIds: Array<{ toHexString(): string } | string>;
}): EditorialSnapshot {
  return {
    title: e.title,
    sport: e.sport,
    league: e.league ?? "",
    teamA: teamKey(e.teamA),
    teamB: teamKey(e.teamB),
    startsAtMin: toMinute(e.startsAt) ?? 0,
    endsAtMin: toMinute(e.endsAt ?? null),
    channelIds: e.channelIds
      .map((c) => (typeof c === "string" ? c : c.toHexString()))
      .sort(),
  };
}

/**
 * Which editorial fields an admin actually changed (vs the stored doc). The
 * caller merges these into `lockedFields` so the sync won't clobber them — a
 * reschedule from the provider is still honored unless the admin pinned the
 * time, etc.
 */
export function diffEditorial(
  before: EditorialSnapshot,
  after: EditorialSnapshot,
): SyncWritableField[] {
  const changed: SyncWritableField[] = [];
  if (before.title !== after.title) changed.push("title");
  if (before.sport !== after.sport) changed.push("sport");
  if (before.league !== after.league) changed.push("league");
  if (before.teamA !== after.teamA) changed.push("teamA");
  if (before.teamB !== after.teamB) changed.push("teamB");
  if (before.startsAtMin !== after.startsAtMin) changed.push("startsAt");
  if (before.endsAtMin !== after.endsAtMin) changed.push("endsAt");
  if (
    before.channelIds.length !== after.channelIds.length ||
    before.channelIds.some((id, i) => id !== after.channelIds[i])
  ) {
    changed.push("channelIds");
  }
  return changed;
}

/** Map a provider status string onto the platform's EventStatus, if possible. */
export function normalizeStatus(raw: string): EventStatus | undefined {
  const s = raw.toLowerCase().trim();
  if (["ns", "tbd", "scheduled", "upcoming", "not_started"].includes(s)) {
    return "upcoming";
  }
  if (["ft", "aet", "pen", "finished", "ended", "match finished"].includes(s)) {
    return "ended";
  }
  if (["1h", "2h", "ht", "live", "in_play", "et", "p", "bt"].includes(s)) {
    return "live";
  }
  return undefined;
}
