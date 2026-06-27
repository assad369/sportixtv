import type { ObjectId } from "mongodb";
import type { EventStatus } from "@/lib/utils";

export interface EventTeam {
  name: string;
  logoUrl?: string;
}

export interface EventDoc {
  _id: ObjectId;
  title: string;
  slug: string;
  sport: string;
  league?: string;
  teamA?: EventTeam;
  teamB?: EventTeam;
  startsAt: Date;
  endsAt?: Date | null;
  /** Stadium / venue, e.g. "Estadio Azteca; Mexico City, MEX". */
  venue?: string;
  /** Admin override; when null/absent the status is derived from the clock. */
  forcedStatus?: EventStatus | null;
  channelIds: ObjectId[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;

  // --- Autopilot / fixture-sync fields (absent on manually created events) ---
  /** Adapter id that produced this event, e.g. "reference" | "api-football". */
  source?: string;
  /** Provider's stable match id within that source. */
  externalId?: string;
  /** `${source}:${externalId}` — the idempotency key (unique + sparse index). */
  externalRef?: string;
  /** Provider's last-modified marker; sync skips the write when unchanged. */
  externalUpdatedAt?: Date | null;
  /** true = created/owned by autopilot; absent/false = manual. */
  syncManaged?: boolean;
  /**
   * Field names an admin has manually pinned. The sync must never overwrite
   * these — "manual override wins". See buildSyncUpdate in lib/sync/transform.
   */
  lockedFields?: string[];
  /** Cross-provider dedupe fingerprint (sparse index). */
  physicalKey?: string;
  /** Bookkeeping: last time a sync touched this doc. */
  lastSyncedAt?: Date | null;
}

/** Fields that get auto-locked the moment an admin edits a synced event. */
export const DEFAULT_LOCKED_FIELDS = [
  "title",
  "channelIds",
  "forcedStatus",
  "isFeatured",
] as const;
