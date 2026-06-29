import type { FetchContext, NormalizedFixture, SyncMode } from "../types";
import type { AdapterCompetition, SourceAdapter } from "./types";

/**
 * ICC Cricket adapter. Fetches from https://www.icc-cricket.com/fixtures-results
 * using a three-stage strategy (stops at first success):
 *   1. Extract embedded __NEXT_DATA__ JSON from the rendered HTML page.
 *   2. Hit a known Umbraco/API endpoint at the same base URL.
 *   3. Treat baseUrl as a direct JSON API endpoint.
 *
 * Competition `providerLeagueId` encodes gender + format as "gender:format":
 *   "men:all"     → all Men's formats
 *   "women:all"   → all Women's formats
 *   "men:T20I"    → Men's T20I only
 *   "women:ODI"   → Women's ODI only
 *   "men:Test"    → Men's Tests only
 *
 * Match duration fallbacks (no endsAt from ICC):
 *   Test: 5 days | ODI: 8 h | T20I / default: 4 h
 */

export const ICC_SOURCE = "icc";

const DEFAULT_BASE = "https://www.icc-cricket.com";
const DEFAULT_RATE_LIMIT = 10; // req/min — conservative for a public website

const FORMAT_DURATIONS_MS: Record<string, number> = {
  Test: 5 * 24 * 60 * 60 * 1000,
  ODI: 8 * 60 * 60 * 1000,
  T20I: 4 * 60 * 60 * 1000,
};

const LOOK_AHEAD_DAYS = 90;

// ── Raw shapes returned by ICC's JSON endpoints ─────────────────────────────

interface IccTeam {
  Name?: string;
  ShortName?: string;
  LogoUrl?: string;
  FlagUrl?: string;
  ImageUrl?: string;
}

interface IccMatch {
  MatchId?: string | number;
  Id?: string | number;
  MatchTitle?: string;
  Title?: string;
  MatchDesc?: string;
  HomeTeam?: IccTeam;
  AwayTeam?: IccTeam;
  Team1?: IccTeam;
  Team2?: IccTeam;
  Series?: { Name?: string; Id?: string | number } | string;
  SeriesName?: string;
  Format?: string;
  MatchFormat?: string;
  MatchType?: string;
  Gender?: string;
  StartDate?: string;
  MatchDate?: string;
  Date?: string;
  StartDateTime?: string;
  Venue?: { Name?: string; Ground?: string } | string;
  VenueName?: string;
  Status?: string;
}

interface IccApiResponse {
  Matches?: IccMatch[];
  matches?: IccMatch[];
  UpcomingMatches?: IccMatch[];
  LiveMatches?: IccMatch[];
  RecentMatches?: IccMatch[];
  data?: { Matches?: IccMatch[] } | IccMatch[];
}

// ── Parsing helpers ──────────────────────────────────────────────────────────

const HAS_TZ = /([zZ]|[+-]\d{2}:?\d{2})$/;

function toUtcDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const iso = HAS_TZ.test(s) ? s : `${s}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function teamLogoUrl(t: IccTeam | undefined): string | undefined {
  return t?.FlagUrl || t?.LogoUrl || t?.ImageUrl || undefined;
}

function matchId(m: IccMatch): string | null {
  const id = m.MatchId ?? m.Id;
  return id != null ? String(id) : null;
}

function seriesName(m: IccMatch): string {
  if (typeof m.Series === "string") return m.Series;
  if (m.Series?.Name) return m.Series.Name;
  return m.SeriesName ?? m.MatchTitle ?? m.Title ?? m.MatchDesc ?? "";
}

function matchFormat(m: IccMatch): string {
  return (m.Format ?? m.MatchFormat ?? m.MatchType ?? "T20I").toUpperCase();
}

function matchGender(m: IccMatch, compGender: string): string {
  const g = (m.Gender ?? "").toLowerCase();
  if (g === "male" || g === "men") return "men";
  if (g === "female" || g === "women") return "women";
  return compGender;
}

function venueName(m: IccMatch): string | undefined {
  if (typeof m.Venue === "string") return m.Venue || undefined;
  if (m.Venue?.Name) return m.Venue.Name;
  if (m.Venue?.Ground) return m.Venue.Ground;
  return m.VenueName || undefined;
}

/** Build a league name that naturally starts with "ICC Men's" or "ICC Women's". */
function buildLeague(gender: string, format: string, series: string): string {
  const genderLabel = gender === "women" ? "Women's" : "Men's";
  if (series && !series.toLowerCase().startsWith("icc")) {
    return `ICC ${genderLabel} ${series}`.replace(/\s+/g, " ").trim();
  }
  if (series) return series.trim();
  return `ICC ${genderLabel} ${format} International`;
}

function durationMs(format: string): number {
  const upper = format.toUpperCase();
  if (upper === "TEST") return FORMAT_DURATIONS_MS.Test;
  if (upper === "ODI") return FORMAT_DURATIONS_MS.ODI;
  return FORMAT_DURATIONS_MS.T20I;
}

/** Map one raw ICC match object to NormalizedFixture. Returns null if unschedulable. */
export function mapIccMatch(
  m: IccMatch,
  compGender: string,
  compFormat: string,
): NormalizedFixture | null {
  const id = matchId(m);
  if (!id) return null;

  const rawDate =
    m.StartDate ?? m.MatchDate ?? m.Date ?? m.StartDateTime ?? null;
  const startsAt = toUtcDate(rawDate);
  if (!startsAt) return null;

  // Skip fixtures more than LOOK_AHEAD_DAYS in the future.
  const windowEnd = new Date(Date.now() + LOOK_AHEAD_DAYS * 86_400_000);
  if (startsAt > windowEnd) return null;

  // Skip fixtures that ended more than 24 h ago.
  const yesterday = new Date(Date.now() - 86_400_000);
  if (startsAt < yesterday) return null;

  const format = matchFormat(m);
  const gender = matchGender(m, compGender);
  const series = seriesName(m);

  // Filter by requested format unless "all".
  if (
    compFormat !== "all" &&
    !format.startsWith(compFormat.toUpperCase())
  ) {
    return null;
  }

  const homeTeam = m.HomeTeam ?? m.Team1;
  const awayTeam = m.AwayTeam ?? m.Team2;
  const homeName = homeTeam?.Name ?? homeTeam?.ShortName ?? "";
  const awayName = awayTeam?.Name ?? awayTeam?.ShortName ?? "";

  const teamA = homeName
    ? { name: homeName, logoUrl: teamLogoUrl(homeTeam) }
    : undefined;
  const teamB = awayName
    ? { name: awayName, logoUrl: teamLogoUrl(awayTeam) }
    : undefined;

  const matchTitle =
    m.MatchTitle ??
    m.Title ??
    (homeName && awayName ? `${homeName} vs ${awayName}` : "");

  const league = buildLeague(gender, format, series);
  const endsAt = new Date(startsAt.getTime() + durationMs(format));

  return {
    externalId: id,
    source: ICC_SOURCE,
    sport: "Cricket",
    league,
    providerLeagueId: String(m.Series && typeof m.Series === "object" ? m.Series.Id ?? id : id),
    title: matchTitle || league || `ICC Match ${id}`,
    teamA,
    teamB,
    startsAt,
    endsAt,
    externalUpdatedAt: startsAt,
    // physicalKey left unset — engine derives it from sport + teams + hour
  };
}

// ── ICC match list extraction from various response shapes ───────────────────

function extractMatches(payload: unknown): IccMatch[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as IccApiResponse;

  // Try all known top-level keys.
  const candidates: (IccMatch[] | undefined)[] = [
    p.Matches,
    p.matches,
    p.UpcomingMatches,
    p.LiveMatches,
    p.RecentMatches,
  ];
  for (const arr of candidates) {
    if (Array.isArray(arr) && arr.length > 0) return arr;
  }

  // data.Matches or data as array
  if (p.data) {
    if (Array.isArray(p.data)) return p.data as IccMatch[];
    if (Array.isArray((p.data as { Matches?: IccMatch[] }).Matches)) {
      return (p.data as { Matches?: IccMatch[] }).Matches!;
    }
  }

  // Recurse one level into any object-valued key.
  for (const v of Object.values(p)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
      return v as IccMatch[];
    }
  }

  return [];
}

// ── __NEXT_DATA__ extraction ─────────────────────────────────────────────────

function extractNextData(html: string): IccMatch[] {
  const match = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    // Navigate common Next.js page prop paths.
    const pageProps =
      parsed?.props?.pageProps ?? parsed?.props ?? parsed ?? {};

    // Try common ICC page prop keys.
    const candidates = [
      pageProps?.fixtures,
      pageProps?.matches,
      pageProps?.upcomingMatches,
      pageProps?.liveMatches,
      pageProps?.data?.matches,
      pageProps?.data?.Matches,
    ];
    for (const c of candidates) {
      const arr = extractMatches({ Matches: c });
      if (arr.length) return arr;
    }
    // Broad fallback: walk all values in pageProps.
    return extractMatches(pageProps);
  } catch {
    return [];
  }
}

// ── HTTP fetch strategies ────────────────────────────────────────────────────

/** Known ICC Umbraco / internal API path fragments to try after the base URL. */
const UMBRACO_PATHS = [
  "/umbraco/api/MatchApi/GetFutureMatches?matchType=upcoming",
  "/umbraco/api/MatchApi/GetFutureMatches",
  "/api/fixtures",
  "/api/v1/fixtures",
  "/api/matches",
];

async function fetchAsJson(
  fetchJson: FetchContext["fetchJson"],
  url: string,
  signal: AbortSignal,
): Promise<IccMatch[]> {
  try {
    const payload = await fetchJson(url, { signal });
    const matches = extractMatches(payload as Record<string, unknown>);
    return matches;
  } catch {
    return [];
  }
}

async function fetchHtmlAndExtract(
  baseUrl: string,
  signal: AbortSignal,
): Promise<IccMatch[]> {
  try {
    const res = await fetch(baseUrl, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SportixTVBot/1.0; +https://www.sportixtv.online)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return extractNextData(html);
  } catch {
    return [];
  }
}

// ── Adapter ──────────────────────────────────────────────────────────────────

function baseOf(ctx: FetchContext): string {
  return (ctx.baseUrl?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

/** Decode "gender:format" from a competition providerLeagueId. */
function decodeComp(providerLeagueId: string): { gender: string; format: string } {
  const [gender = "men", format = "all"] = providerLeagueId.split(":");
  return { gender, format };
}

export const iccAdapter: SourceAdapter = {
  id: ICC_SOURCE,
  label: "ICC Cricket (icc-cricket.com)",
  sport: "Cricket",
  defaultBaseUrl: DEFAULT_BASE,
  defaultRateLimitPerMin: DEFAULT_RATE_LIMIT,

  async listCompetitions(_ctx: FetchContext): Promise<AdapterCompetition[]> {
    return [
      { id: "men:all", label: "Men's — All Formats" },
      { id: "women:all", label: "Women's — All Formats" },
      { id: "men:T20I", label: "Men's T20I" },
      { id: "men:ODI", label: "Men's ODI" },
      { id: "men:Test", label: "Men's Tests" },
      { id: "women:T20I", label: "Women's T20I" },
      { id: "women:ODI", label: "Women's ODI" },
      { id: "women:Test", label: "Women's Tests" },
    ];
  },

  async *fetchFixtures(
    ctx: FetchContext,
    _mode: SyncMode,
  ): AsyncGenerator<NormalizedFixture[]> {
    const base = baseOf(ctx);

    // Resolve which gender+format combos the admin wants.
    const comps = ctx.competitions.length
      ? ctx.competitions
      : [{ providerLeagueId: "men:all" }, { providerLeagueId: "women:all" }];

    // Step 1: Fetch all matches from ICC once (expensive — one HTTP request).
    let allMatches: IccMatch[] = [];

    // Strategy A: treat base as direct JSON API endpoint.
    if (base !== DEFAULT_BASE) {
      allMatches = await fetchAsJson(ctx.fetchJson, base, ctx.signal);
    }

    // Strategy B: try known Umbraco paths.
    if (!allMatches.length) {
      for (const path of UMBRACO_PATHS) {
        if (ctx.signal.aborted) break;
        allMatches = await fetchAsJson(ctx.fetchJson, `${base}${path}`, ctx.signal);
        if (allMatches.length) break;
      }
    }

    // Strategy C: fetch HTML page and extract __NEXT_DATA__.
    if (!allMatches.length && !ctx.signal.aborted) {
      allMatches = await fetchHtmlAndExtract(base, ctx.signal);
    }

    if (!allMatches.length) {
      // Nothing found — log via empty yield so the engine records the attempt.
      return;
    }

    // Step 2: For each competition config, filter + normalise.
    for (const comp of comps) {
      if (ctx.signal.aborted) break;

      const { gender, format } = decodeComp(comp.providerLeagueId);
      const page: NormalizedFixture[] = [];

      for (const m of allMatches) {
        const normalized = mapIccMatch(m, gender, format);
        if (normalized) page.push(normalized);
      }

      if (page.length) yield page;
    }
  },
};
