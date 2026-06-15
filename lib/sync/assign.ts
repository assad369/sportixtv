import type { ObjectId } from "mongodb";
import type { LeagueChannelMapDoc } from "@/lib/db/schemas/league-channel-map";
import type { NormalizedFixture } from "./types";

/**
 * Pure league→channel assignment. DB loading (maps + valid channel ids) is done
 * by the engine and passed in, keeping this testable with no server runtime.
 */

type FixtureMatchFields = Pick<
  NormalizedFixture,
  "sport" | "league" | "providerLeagueId" | "source"
>;

/**
 * Higher = more specific. providerLeagueId+source (3) beats league (2) beats
 * sport (1). null = no match.
 */
export function matchScore(
  map: Pick<LeagueChannelMapDoc, "match">,
  fixture: FixtureMatchFields,
): number | null {
  const m = map.match;
  if (
    m.providerLeagueId &&
    m.source &&
    m.providerLeagueId === fixture.providerLeagueId &&
    m.source === fixture.source
  ) {
    return 3;
  }
  if (
    m.league &&
    fixture.league &&
    m.league.toLowerCase() === fixture.league.toLowerCase()
  ) {
    return 2;
  }
  if (m.sport && m.sport.toLowerCase() === fixture.sport.toLowerCase()) {
    return 1;
  }
  return null;
}

/**
 * Resolve the channels a fixture should broadcast on. Uses the most specific
 * tier that matches (sport-wide rules act only as a fallback), unions the
 * channels of all rules at that tier, and drops any channel id not in
 * `validChannelIds` (stale refs would break the events↔channels join).
 */
export function resolveChannelIds(
  fixture: FixtureMatchFields,
  maps: Array<Pick<LeagueChannelMapDoc, "match" | "channelIds">>,
  validChannelIds: Set<string>,
): ObjectId[] {
  let bestScore = 0;
  const picked = new Map<string, ObjectId>();
  for (const map of maps) {
    const score = matchScore(map, fixture);
    if (score == null || score < bestScore) continue;
    if (score > bestScore) {
      bestScore = score;
      picked.clear();
    }
    for (const id of map.channelIds) {
      const hex = id.toHexString();
      if (validChannelIds.has(hex)) picked.set(hex, id);
    }
  }
  return [...picked.values()];
}
