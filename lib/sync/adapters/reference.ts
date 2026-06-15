import type { FetchContext, NormalizedFixture } from "../types";
import type { AdapterCompetition, SourceAdapter } from "./types";

/**
 * Reference adapter — proves the whole pipeline end-to-end without a paid
 * provider contract. Two modes:
 *   1. If a `baseUrl` is configured, it GETs a JSON feed (an array of
 *      RawReferenceFixture, or `{ fixtures: [...] }`) and maps it.
 *   2. Otherwise it synthesizes deterministic demo fixtures so "Sync now"
 *      immediately produces visible, idempotent events.
 *
 * Real providers (api-football, cricapi, …) are added as sibling files and
 * registered in ./index — this file is the template for them.
 */

export interface RawReferenceFixture {
  id: string | number;
  league?: string;
  leagueId?: string | number;
  sport?: string;
  home?: string;
  homeLogo?: string;
  away?: string;
  awayLogo?: string;
  /** ISO 8601 with offset/Z — converted to a UTC Date. */
  start: string;
  end?: string | null;
  status?: string;
  updated?: string | null;
}

const SOURCE_ID = "reference";

/** Pure mapper — exercised directly by unit tests. */
export function mapReferenceFixture(
  raw: RawReferenceFixture,
  fallback: { league: string; providerLeagueId: string; sport: string },
): NormalizedFixture {
  const startsAt = new Date(raw.start);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error(`Invalid start time: ${raw.start}`);
  }
  const home = raw.home?.trim();
  const away = raw.away?.trim();
  const teamA = home ? { name: home, logoUrl: raw.homeLogo } : undefined;
  const teamB = away ? { name: away, logoUrl: raw.awayLogo } : undefined;
  const league = raw.league?.trim() || fallback.league;
  return {
    externalId: String(raw.id),
    source: SOURCE_ID,
    sport: raw.sport?.trim() || fallback.sport,
    league,
    providerLeagueId: String(raw.leagueId ?? fallback.providerLeagueId),
    title: home && away ? `${home} vs ${away}` : league,
    teamA,
    teamB,
    startsAt,
    endsAt: raw.end ? new Date(raw.end) : null,
    status: raw.status as NormalizedFixture["status"],
    externalUpdatedAt: raw.updated ? new Date(raw.updated) : startsAt,
  };
}

const DEMO_TEAMS = [
  "Northgate Rovers",
  "Riverside United",
  "Kingsway Athletic",
  "Eastfield City",
  "Harborline FC",
  "Summit Wanderers",
  "Crownvale Town",
  "Westmoor Rangers",
];

/** Start of the current UTC day — anchors deterministic, idempotent demo data. */
function utcDayStart(now = Date.now()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function* synthFixtures(
  comps: FetchContext["competitions"],
): Generator<NormalizedFixture> {
  const competitions =
    comps.length > 0
      ? comps
      : [{ providerLeagueId: "demo-league", season: undefined }];
  const dayStart = utcDayStart();
  const dayKey = dayStart.toISOString().slice(0, 10);

  for (const comp of competitions) {
    const league = `Demo ${comp.providerLeagueId}`;
    for (let i = 0; i < 6; i++) {
      const home = DEMO_TEAMS[(i * 2) % DEMO_TEAMS.length];
      const away = DEMO_TEAMS[(i * 2 + 1) % DEMO_TEAMS.length];
      const startsAt = new Date(dayStart.getTime() + (12 + i * 2) * 3600_000);
      yield {
        externalId: `${comp.providerLeagueId}-${dayKey}-${i}`,
        source: SOURCE_ID,
        sport: "football",
        league,
        providerLeagueId: comp.providerLeagueId,
        title: `${home} vs ${away}`,
        teamA: { name: home },
        teamB: { name: away },
        startsAt,
        endsAt: null,
        // Stable within the day → re-syncs short-circuit (idempotent).
        externalUpdatedAt: dayStart,
      };
    }
  }
}

function asRawArray(payload: unknown): RawReferenceFixture[] {
  if (Array.isArray(payload)) return payload as RawReferenceFixture[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { fixtures?: unknown }).fixtures)
  ) {
    return (payload as { fixtures: RawReferenceFixture[] }).fixtures;
  }
  return [];
}

export const referenceAdapter: SourceAdapter = {
  id: SOURCE_ID,
  label: "Reference (demo / generic JSON)",
  sport: "various",
  defaultRateLimitPerMin: 60,

  async listCompetitions(): Promise<AdapterCompetition[]> {
    return [{ id: "demo-league", label: "Demo League" }];
  },

  async *fetchFixtures(ctx: FetchContext): AsyncGenerator<NormalizedFixture[]> {
    if (ctx.baseUrl) {
      const payload = await ctx.fetchJson(ctx.baseUrl);
      const raws = asRawArray(payload);
      const page: NormalizedFixture[] = [];
      for (const raw of raws) {
        page.push(
          mapReferenceFixture(raw, {
            league: "Reference League",
            providerLeagueId: "reference",
            sport: "football",
          }),
        );
        if (page.length >= 25) {
          yield page.splice(0, page.length);
        }
      }
      if (page.length) yield page;
      return;
    }

    // Synthetic mode — yield in small pages to exercise pagination/time-budget.
    let page: NormalizedFixture[] = [];
    for (const f of synthFixtures(ctx.competitions)) {
      page.push(f);
      if (page.length >= 4) {
        yield page;
        page = [];
      }
    }
    if (page.length) yield page;
  },
};
