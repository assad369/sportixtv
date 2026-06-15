import type { EventStatus } from "@/lib/utils";

export interface NormalizedTeam {
  name: string;
  logoUrl?: string;
}

/**
 * Provider-agnostic fixture shape. Every adapter normalizes its responses into
 * this; the engine maps it onto an EventDoc. `startsAt` is ALWAYS a real UTC
 * Date — adapters must convert provider local/offset times before yielding.
 */
export interface NormalizedFixture {
  externalId: string;
  source: string;
  sport: string;
  league: string;
  providerLeagueId: string;
  title: string;
  teamA?: NormalizedTeam;
  teamB?: NormalizedTeam;
  startsAt: Date;
  endsAt?: Date | null;
  status?: EventStatus;
  /** Provider last-modified marker; lets the sync skip unchanged fixtures. */
  externalUpdatedAt?: Date | null;
  /** Optional adapter-supplied dedupe hint; else the engine derives one. */
  physicalKey?: string;
}

export type SyncMode = "fixtures" | "live";

/** Everything an adapter needs to talk to its provider during one run. */
export interface FetchContext {
  apiKey?: string;
  baseUrl?: string;
  competitions: Array<{ providerLeagueId: string; season?: string }>;
  /** Aborts when the run's time budget is exhausted. */
  signal: AbortSignal;
  /** Shared HTTP client with rate-limiting + retry/backoff. */
  fetchJson: (url: string, init?: RequestInit) => Promise<unknown>;
}
