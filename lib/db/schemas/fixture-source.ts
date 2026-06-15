import type { ObjectId } from "mongodb";
import type { EncryptedBlob } from "@/lib/crypto";

/** A competition/league within a source that the admin has opted to sync. */
export interface SourceCompetition {
  /** Provider's league/competition id (passed to the adapter). */
  providerLeagueId: string;
  /** Human label shown in the admin UI. */
  label: string;
  /** Optional season identifier some providers require (e.g. "2025"). */
  season?: string;
  enabled: boolean;
}

/**
 * One configured provider instance. Multiple docs may use the same adapter
 * (e.g. two API-Football accounts) — `adapter` selects the code, this doc
 * carries the credentials + which competitions to pull.
 */
export interface FixtureSourceDoc {
  _id: ObjectId;
  /** Adapter id from the registry (lib/sync/adapters). */
  adapter: string;
  label: string;
  enabled: boolean;
  /** Provider API key, AES-256-GCM encrypted at rest. Never sent to client. */
  apiKeyEnc?: EncryptedBlob | null;
  /** Optional base-URL override for the adapter. */
  baseUrl?: string;
  competitions: SourceCompetition[];
  /** Per-source request budget; falls back to the adapter default when absent. */
  rateLimitPerMin?: number;
  /** Higher wins when the same physical match arrives from multiple sources. */
  priority: number;
  lastRunAt?: Date | null;
  lastStatus?: "ok" | "partial" | "error" | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public projection — safe to expose to the admin client. Deliberately omits
 * `apiKeyEnc`; readers expose only a `hasKey` boolean (see lib/data/fixtures).
 */
export const FIXTURE_SOURCE_PUBLIC_PROJECTION = {
  adapter: 1,
  label: 1,
  enabled: 1,
  baseUrl: 1,
  competitions: 1,
  rateLimitPerMin: 1,
  priority: 1,
  lastRunAt: 1,
  lastStatus: 1,
  createdAt: 1,
  updatedAt: 1,
} as const;
