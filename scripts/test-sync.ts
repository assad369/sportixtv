/**
 * Pure-logic tests for the autopilot sync core — no DB, no Next runtime.
 * Run: `pnpm tsx scripts/test-sync.ts`
 */
import { ObjectId } from "mongodb";
import {
  buildSyncUpdate,
  diffEditorial,
  physicalKeyOf,
  snapshotEditorial,
  type SyncCandidate,
} from "../lib/sync/transform";
import { resolveChannelIds as _assignResolve } from "../lib/sync/assign";
import { mapReferenceFixture } from "../lib/sync/adapters/reference";

let passed = 0;
let failed = 0;
function ok(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

const chA = new ObjectId();
const chB = new ObjectId();
const chC = new ObjectId();

function candidate(over: Partial<SyncCandidate> = {}): SyncCandidate {
  return {
    title: "Home vs Away",
    sport: "football",
    league: "La Liga",
    teamA: { name: "Home" },
    teamB: { name: "Away" },
    startsAt: new Date("2026-05-01T19:00:00Z"),
    endsAt: null,
    channelIds: [chA],
    source: "reference",
    externalId: "m1",
    externalRef: "reference:m1",
    externalUpdatedAt: new Date("2026-04-30T00:00:00Z"),
    physicalKey: "football|away--home|2026-05-01T19",
    ...over,
  };
}

console.log("buildSyncUpdate");
{
  const plan = buildSyncUpdate(null, candidate());
  ok("create on no existing", plan.decision === "create");
  ok("create sets syncManaged", plan.set.syncManaged === true);
  ok("create sets channelIds", Array.isArray(plan.set.channelIds));
  ok(
    "create setOnInsert defaults",
    plan.setOnInsert.forcedStatus === null &&
      plan.setOnInsert.isFeatured === false,
  );
}
{
  const existing = {
    externalUpdatedAt: new Date("2026-04-30T00:00:00Z"),
    syncManaged: true,
    lockedFields: [],
  };
  const plan = buildSyncUpdate(existing, candidate());
  ok("skip when externalUpdatedAt unchanged", plan.decision === "skip");
}
{
  const existing = {
    externalUpdatedAt: new Date("2026-04-29T00:00:00Z"),
    syncManaged: true,
    lockedFields: ["channelIds", "startsAt"],
  };
  const plan = buildSyncUpdate(existing, candidate());
  ok("update when externalUpdatedAt newer", plan.decision === "update");
  ok("locked channelIds dropped", !("channelIds" in plan.set));
  ok("locked startsAt dropped", !("startsAt" in plan.set));
  ok("unlocked title still written", plan.set.title === "Home vs Away");
}
{
  // A manual event matched by physicalKey is only linked, never overwritten.
  const existing = {
    externalUpdatedAt: null,
    syncManaged: false,
    lockedFields: [],
  };
  const plan = buildSyncUpdate(existing, candidate());
  ok("manual event link-only (no title)", !("title" in plan.set));
  ok("manual event link sets externalRef", plan.set.externalRef === "reference:m1");
}

console.log("physicalKeyOf");
{
  const a = physicalKeyOf({
    sport: "football",
    teamA: { name: "Real Madrid" },
    teamB: { name: "Barcelona" },
    startsAt: new Date("2026-05-01T19:05:00Z"),
  });
  const b = physicalKeyOf({
    sport: "football",
    teamA: { name: "Barcelona" },
    teamB: { name: "Real Madrid" },
    startsAt: new Date("2026-05-01T19:55:00Z"),
  });
  ok("order-independent + hour-bucketed equal", a === b);
}

console.log("resolveChannelIds (assign)");
{
  const maps = [
    { match: { sport: "football" }, channelIds: [chC] },
    { match: { league: "La Liga" }, channelIds: [chA, chB] },
  ];
  const valid = new Set([chA, chB, chC].map((c) => c.toHexString()));
  const fixture = {
    sport: "football",
    league: "la liga",
    providerLeagueId: "140",
    source: "reference",
  };
  const out = _assignResolve(fixture, maps, valid).map((o) => o.toHexString());
  ok("league rule beats sport fallback", out.length === 2);
  ok("includes mapped channels", out.includes(chA.toHexString()));
  ok("excludes sport-fallback channel", !out.includes(chC.toHexString()));
}
{
  const maps = [{ match: { league: "La Liga" }, channelIds: [chA, chB] }];
  const valid = new Set([chA.toHexString()]); // chB no longer exists
  const out = _assignResolve(
    { sport: "football", league: "La Liga", providerLeagueId: "140", source: "x" },
    maps,
    valid,
  );
  ok("stale channel dropped", out.length === 1 && out[0].equals(chA));
}

console.log("diffEditorial");
{
  const before = snapshotEditorial({
    title: "A vs B",
    sport: "football",
    league: "L",
    teamA: { name: "A" },
    teamB: { name: "B" },
    startsAt: new Date("2026-05-01T19:00:00Z"),
    endsAt: null,
    channelIds: [chA],
  });
  const after = snapshotEditorial({
    title: "A vs B",
    sport: "football",
    league: "L",
    teamA: { name: "A" },
    teamB: { name: "B" },
    startsAt: new Date("2026-05-01T20:00:00Z"), // changed
    endsAt: null,
    channelIds: [chA, chB], // changed
  });
  const changed = diffEditorial(before, after);
  ok("detects startsAt change", changed.includes("startsAt"));
  ok("detects channelIds change", changed.includes("channelIds"));
  ok("ignores unchanged title", !changed.includes("title"));
}

console.log("mapReferenceFixture");
{
  const f = mapReferenceFixture(
    {
      id: 42,
      league: "Demo League",
      leagueId: "demo",
      home: "Reds",
      away: "Blues",
      start: "2026-05-01T19:00:00+02:00",
    },
    { league: "fallback", providerLeagueId: "fb", sport: "football" },
  );
  ok("externalId stringified", f.externalId === "42");
  ok("title from teams", f.title === "Reds vs Blues");
  ok(
    "start converted to UTC",
    f.startsAt.toISOString() === "2026-05-01T17:00:00.000Z",
  );
  ok("source tagged", f.source === "reference");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
