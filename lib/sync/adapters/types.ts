import type { FetchContext, NormalizedFixture, SyncMode } from "../types";

export interface AdapterCompetition {
  id: string;
  label: string;
  season?: string;
}

/**
 * A pluggable fixture provider. Add a file implementing this and register it in
 * adapters/index.ts — no other code changes needed.
 *
 * `fetchFixtures` is an async generator that yields ONE PAGE at a time so the
 * engine can upsert incrementally and stop on its time budget between pages.
 */
export interface SourceAdapter {
  id: string;
  label: string;
  sport: string;
  defaultBaseUrl?: string;
  defaultRateLimitPerMin?: number;
  /** Discover selectable competitions to populate the admin dropdown. */
  listCompetitions?(ctx: FetchContext): Promise<AdapterCompetition[]>;
  fetchFixtures(
    ctx: FetchContext,
    mode: SyncMode,
  ): AsyncGenerator<NormalizedFixture[]>;
}
