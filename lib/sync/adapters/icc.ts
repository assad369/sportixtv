import type { FetchContext, NormalizedFixture, SyncMode } from "../types";
import type { AdapterCompetition, SourceAdapter } from "./types";
import { launchBrowser } from "../browser";

/**
 * ICC Cricket adapter. Fetches from https://www.icc-cricket.com/fixtures-results
 * using a three-stage strategy (stops at first success):
 *   1. Treat baseUrl as a direct JSON endpoint (works when admin configures a
 *      discovered API URL from browser DevTools).
 *   2. Try known ICC API paths against the site's origin.
 *   3. Fetch the HTML page and extract __NEXT_DATA__ or JSON-LD structured data.
 *
 * If all three strategies return nothing, the adapter throws a descriptive error
 * so the engine records it in SyncRun.errors and the admin can diagnose.
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

  // venue is derived but unused in NormalizedFixture currently — kept for future use
  void venueName(m);

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

// ── JSON-LD extraction ────────────────────────────────────────────────────────

function collectSportsEvents(data: unknown, out: IccMatch[]): void {
  if (!data || typeof data !== "object") return;
  const d = data as Record<string, unknown>;
  const type = d["@type"];

  if (type === "SportsEvent" || type === "Event") {
    const competitors = Array.isArray(d.competitor) ? d.competitor : [];
    const c0 = competitors[0] as Record<string, unknown> | undefined;
    const c1 = competitors[1] as Record<string, unknown> | undefined;
    const startDate = String(d.startDate ?? "");
    const name = String(d.name ?? "");
    if (startDate) {
      out.push({
        // Stable fingerprint ID — consistent across syncs for the same match.
        Id: `jsonld:${startDate}||${name}`,
        Title: name || undefined,
        StartDate: startDate,
        VenueName:
          typeof d.location === "object" && d.location !== null
            ? String((d.location as Record<string, unknown>).name ?? "") || undefined
            : undefined,
        HomeTeam: c0 ? { Name: String(c0.name ?? "") } : undefined,
        AwayTeam: c1 ? { Name: String(c1.name ?? "") } : undefined,
      });
    }
  }

  if (type === "ItemList" && Array.isArray(d.itemListElement)) {
    for (const el of d.itemListElement) {
      const item =
        typeof el === "object" && el !== null && "item" in el
          ? (el as { item: unknown }).item
          : el;
      collectSportsEvents(item, out);
    }
  }
}

/** Extract SportsEvent objects from any JSON-LD blocks in the HTML. */
function extractJsonLd(html: string): IccMatch[] {
  const results: IccMatch[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      const raw: unknown = JSON.parse(m[1]);
      const items = Array.isArray(raw) ? raw : [raw];
      for (const item of items) {
        collectSportsEvents(item, results);
      }
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return results;
}

// ── HTTP fetch strategies ────────────────────────────────────────────────────

/**
 * Known ICC API paths to try against the site's origin (not the full base URL).
 * Ordered from most-likely to least-likely based on common cricket website patterns.
 */
const ICC_API_PATHS = [
  "/api/matches?status=upcoming",
  "/api/matches",
  "/api/fixtures?status=upcoming",
  "/api/fixtures",
  "/api/cricket/fixtures",
  "/umbraco/api/MatchApi/GetFutureMatches?matchType=upcoming",
  "/umbraco/api/MatchApi/GetFutureMatches",
];

async function fetchAsJson(
  fetchJson: FetchContext["fetchJson"],
  url: string,
  signal: AbortSignal,
  diag: string[],
): Promise<IccMatch[]> {
  try {
    const payload = await fetchJson(url, { signal });
    const matches = extractMatches(payload as Record<string, unknown>);
    if (!matches.length) {
      diag.push(`${url}: JSON parsed but no match array found`);
    }
    return matches;
  } catch (err) {
    diag.push(
      `${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }
}

async function fetchHtmlAndExtract(
  baseUrl: string,
  signal: AbortSignal,
  diag: string[],
): Promise<IccMatch[]> {
  let html: string;
  try {
    const res = await fetch(baseUrl, {
      signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      diag.push(`HTML fetch ${baseUrl}: HTTP ${res.status}`);
      return [];
    }
    html = await res.text();
  } catch (err) {
    diag.push(
      `HTML fetch ${baseUrl}: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  }

  // Strategy C1: __NEXT_DATA__ (works when ICC uses SSR, not PPR/streaming)
  const fromNextData = extractNextData(html);
  if (fromNextData.length) return fromNextData;

  // Strategy C2: JSON-LD structured data (SportsEvent / ItemList)
  const fromJsonLd = extractJsonLd(html);
  if (fromJsonLd.length) return fromJsonLd;

  diag.push(
    `HTML fetch ${baseUrl}: page fetched (${html.length} chars) but no fixture data in __NEXT_DATA__ or JSON-LD. ` +
    `ICC likely uses client-side data loading (PPR/streaming).`,
  );
  return [];
}

// ── Headless browser strategy ────────────────────────────────────────────────

/**
 * Primary fetch strategy. Launches a headless Playwright browser, navigates to
 * the ICC fixtures page, and intercepts XHR/fetch responses that contain match
 * data. This handles ICC's PPR/CSR setup where the server-side HTML contains no
 * fixture payload and all data is loaded client-side via JavaScript.
 *
 * Falls back to reading __NEXT_DATA__ from the fully-rendered DOM in case ICC
 * ever reverts to SSR. Returns [] on any error so the caller can try strategies
 * A–C instead.
 */
async function fetchViaHeadlessBrowser(
  pageUrl: string,
  signal: AbortSignal,
  diag: string[],
): Promise<IccMatch[]> {
  let browser = null;
  try {
    browser = await launchBrowser();
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
    });
    const page = await ctx.newPage();
    const capturedMatches: IccMatch[] = [];

    // Intercept JSON responses from likely fixture/match API calls.
    page.on("response", async (response) => {
      const url = response.url();
      const ct = response.headers()["content-type"] ?? "";
      if (!ct.includes("application/json")) return;
      if (!/match|fixture|schedule|cricket/i.test(url)) return;
      try {
        const json = await response.json();
        const found = extractMatches(json as Record<string, unknown>);
        if (found.length) capturedMatches.push(...found);
      } catch {
        // Non-JSON body or parse error — ignore
      }
    });

    // Abort-aware navigation with a 30 s hard cap (inside the 45 s cron budget).
    const abortPromise = new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => reject(new Error("sync aborted")), { once: true });
    });
    await Promise.race([
      page.goto(pageUrl, { waitUntil: "networkidle", timeout: 30_000 }),
      abortPromise,
    ]);

    // If XHR interception found nothing, try __NEXT_DATA__ from the rendered DOM.
    if (!capturedMatches.length) {
      const html = await page.content();
      capturedMatches.push(...extractNextData(html));
    }

    await ctx.close();
    return capturedMatches;
  } catch (err) {
    diag.push(
      `headless browser [${pageUrl}]: ${err instanceof Error ? err.message : String(err)}`,
    );
    return [];
  } finally {
    if (browser) await browser.close().catch(() => {});
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
    const diag: string[] = [];

    // Resolve which gender+format combos the admin wants.
    const comps = ctx.competitions.length
      ? ctx.competitions
      : [{ providerLeagueId: "men:all" }, { providerLeagueId: "women:all" }];

    // Step 1: Fetch all matches from ICC once.
    let allMatches: IccMatch[] = [];

    // Strategy 0 (primary): headless browser with XHR/fetch interception.
    // ICC uses PPR/CSR so the server-side HTML contains no fixture data;
    // a real browser execution is required to trigger the data-loading JS.
    if (!allMatches.length && !ctx.signal.aborted) {
      const origin = (() => {
        try { return new URL(base).origin; } catch { return base; }
      })();
      allMatches = await fetchViaHeadlessBrowser(
        `${origin}/fixtures-results`,
        ctx.signal,
        diag,
      );
    }

    // Strategy A: treat base URL as a direct JSON API endpoint.
    // This works when the admin has configured a discovered JSON API URL (e.g. from
    // browser DevTools) rather than the default HTML page URL.
    if (!allMatches.length && !ctx.signal.aborted) {
      allMatches = await fetchAsJson(ctx.fetchJson, base, ctx.signal, diag);
    }

    // Strategy B: try known ICC API paths against the site's origin.
    // Extracts just the origin so paths like /api/matches are correct — appending
    // to the full base URL (e.g. /fixtures-results/api/matches) would always 404.
    if (!allMatches.length && !ctx.signal.aborted) {
      const origin = (() => {
        try {
          return new URL(base).origin;
        } catch {
          return base;
        }
      })();

      for (const path of ICC_API_PATHS) {
        if (ctx.signal.aborted) break;
        const found = await fetchAsJson(
          ctx.fetchJson,
          `${origin}${path}`,
          ctx.signal,
          diag,
        );
        if (found.length) {
          allMatches = found;
          break;
        }
      }
    }

    // Strategy C: fetch HTML page → extract __NEXT_DATA__ and/or JSON-LD.
    if (!allMatches.length && !ctx.signal.aborted) {
      allMatches = await fetchHtmlAndExtract(base, ctx.signal, diag);
    }

    // All strategies exhausted — throw so the engine logs a real error into
    // SyncRun.errors and the admin sees a red badge with an actionable message.
    if (!allMatches.length) {
      throw new Error(
        "ICC adapter: no fixtures found after trying all strategies (headless browser + HTTP fallbacks). " +
        "Diagnostics: " +
        (diag.length ? diag.join(" | ") : "all strategies returned empty") +
        " — Check that CHROMIUM_RELEASE_URL is set in env and the ICC fixtures page is reachable.",
      );
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
