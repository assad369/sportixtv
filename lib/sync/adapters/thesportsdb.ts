import type { FetchContext, NormalizedFixture } from "../types";
import type { AdapterCompetition, SourceAdapter } from "./types";

/**
 * TheSportsDB v1 adapter — the default data source. Uses the free tier (key
 * "123") which covers our scheduling use case: upcoming fixtures per league via
 * `eventsnextleague.php`. The API key lives in the URL PATH (v1 design); v2 /
 * livescores are premium and unneeded (status is clock-derived).
 *
 * Docs: https://www.thesportsdb.com/api
 */

const SOURCE_ID = "thesportsdb";
const DEFAULT_BASE = "https://www.thesportsdb.com/api/v1/json";
const FREE_KEY = "123";

/** Raw event shape from eventsnextleague.php / eventsseason.php. */
export interface RawTheSportsDbEvent {
  idEvent?: string;
  strEvent?: string;
  strSport?: string;
  idLeague?: string;
  strLeague?: string;
  strSeason?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strHomeTeamBadge?: string | null;
  strAwayTeamBadge?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  /** UTC but WITHOUT a timezone suffix, e.g. "2024-08-16T19:00:00". */
  strTimestamp?: string | null;
  strStatus?: string | null;
  strPostponed?: string | null;
}

const HAS_TZ = /([zZ]|[+-]\d\d:?\d\d)$/;

/**
 * Build a real UTC Date from TheSportsDB time fields. Their timestamps are UTC
 * but omit the `Z`, so a bare value is treated as UTC (append `Z`) rather than
 * letting `new Date` interpret it as server-local time.
 */
export function toUtcDate(
  strTimestamp?: string | null,
  dateEvent?: string | null,
  strTime?: string | null,
): Date | null {
  let raw = strTimestamp?.trim();
  if (!raw) {
    if (!dateEvent) return null;
    raw = `${dateEvent.trim()}T${(strTime || "00:00:00").trim()}`;
  }
  const iso = HAS_TZ.test(raw) ? raw : `${raw}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Pure mapper — exercised directly by unit tests. Returns null if unschedulable. */
export function mapTheSportsDbEvent(
  raw: RawTheSportsDbEvent,
): NormalizedFixture | null {
  if (!raw.idEvent) return null;
  const startsAt = toUtcDate(raw.strTimestamp, raw.dateEvent, raw.strTime);
  if (!startsAt) return null;

  const home = raw.strHomeTeam?.trim();
  const away = raw.strAwayTeam?.trim();
  const teamA = home
    ? { name: home, logoUrl: raw.strHomeTeamBadge || undefined }
    : undefined;
  const teamB = away
    ? { name: away, logoUrl: raw.strAwayTeamBadge || undefined }
    : undefined;

  const title =
    raw.strEvent?.trim() || (home && away ? `${home} vs ${away}` : "");
  const league = raw.strLeague?.trim() || "";

  return {
    externalId: String(raw.idEvent),
    source: SOURCE_ID,
    sport: raw.strSport?.trim() || "",
    league,
    providerLeagueId: String(raw.idLeague ?? ""),
    title: title || league || `Event ${raw.idEvent}`,
    teamA,
    teamB,
    startsAt,
    endsAt: null,
    // Kickoff doubles as the change marker: a reschedule updates it (so the
    // sync writes), an unchanged fixture hits the engine's skip path.
    externalUpdatedAt: startsAt,
  };
}

function apiKeyOf(ctx: FetchContext): string {
  return ctx.apiKey?.trim() || FREE_KEY;
}

function baseOf(ctx: FetchContext): string {
  return (ctx.baseUrl?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

/** Discover leagues for a country + sport (admin League Finder). */
export async function fetchTheSportsDbLeagues(
  fetchJson: FetchContext["fetchJson"],
  apiKey: string,
  country: string,
  sport: string,
  baseUrl = DEFAULT_BASE,
): Promise<AdapterCompetition[]> {
  const base = baseUrl.replace(/\/+$/, "");
  const url = `${base}/${apiKey || FREE_KEY}/search_all_leagues.php?c=${encodeURIComponent(
    country,
  )}&s=${encodeURIComponent(sport)}`;
  const payload = (await fetchJson(url)) as Record<string, unknown> | null;
  const list =
    (payload?.countries as RawLeague[] | null) ??
    (payload?.leagues as RawLeague[] | null) ??
    (payload?.countrys as RawLeague[] | null) ??
    [];
  return (list ?? [])
    .filter((l) => l?.idLeague)
    .map((l) => ({
      id: String(l.idLeague),
      label: l.strLeague ?? String(l.idLeague),
      season: l.strSport ?? undefined,
    }));
}

interface RawLeague {
  idLeague?: string;
  strLeague?: string;
  strSport?: string;
}

export const thesportsdbAdapter: SourceAdapter = {
  id: SOURCE_ID,
  label: "TheSportsDB",
  sport: "various",
  defaultBaseUrl: DEFAULT_BASE,
  defaultRateLimitPerMin: 30,

  async listCompetitions(ctx: FetchContext): Promise<AdapterCompetition[]> {
    // Soccer is the broadest catalogue; the League Finder page covers the rest.
    return fetchTheSportsDbLeagues(
      ctx.fetchJson,
      apiKeyOf(ctx),
      "England",
      "Soccer",
      baseOf(ctx),
    );
  },

  async *fetchFixtures(ctx: FetchContext): AsyncGenerator<NormalizedFixture[]> {
    const base = baseOf(ctx);
    const key = apiKeyOf(ctx);
    for (const comp of ctx.competitions) {
      const url = `${base}/${key}/eventsnextleague.php?id=${encodeURIComponent(
        comp.providerLeagueId,
      )}`;
      const payload = (await ctx.fetchJson(url)) as {
        events?: RawTheSportsDbEvent[] | null;
      } | null;
      const events = payload?.events ?? [];
      const page: NormalizedFixture[] = [];
      for (const raw of events) {
        const mapped = mapTheSportsDbEvent(raw);
        if (mapped) page.push(mapped);
      }
      if (page.length) yield page;
    }
  },
};
