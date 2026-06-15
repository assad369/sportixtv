import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  fixtureSources,
  leagueChannelMaps,
  syncRuns,
} from "@/lib/db/collections";
import type { SourceCompetition } from "@/lib/db/schemas/fixture-source";
import type {
  SyncRunCounts,
  SyncRunDoc,
} from "@/lib/db/schemas/sync-run";
import { safeQuery } from "./safe";

/** Source as exposed to the admin client — NEVER includes the API key value. */
export interface FixtureSourceLite {
  id: string;
  adapter: string;
  label: string;
  enabled: boolean;
  hasKey: boolean;
  baseUrl?: string;
  competitions: SourceCompetition[];
  rateLimitPerMin?: number;
  priority: number;
  lastRunAt: string | null;
  lastStatus: "ok" | "partial" | "error" | null;
}

export interface LeagueChannelMapLite {
  id: string;
  match: {
    sport?: string;
    league?: string;
    providerLeagueId?: string;
    source?: string;
  };
  channelIds: string[];
  priority: number;
  enabled: boolean;
}

export interface SyncRunLite {
  id: string;
  sourceId: string | null;
  adapter: string;
  trigger: "cron" | "manual";
  mode: "fixtures" | "live";
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "ok" | "partial" | "error";
  counts: SyncRunCounts;
  errors: { stage: string; message: string; at: string }[];
}

export async function getFixtureSources(): Promise<FixtureSourceLite[]> {
  "use cache";
  cacheTag("fixture-sources");
  cacheLife("hours");
  return safeQuery([], async () => {
    const col = await fixtureSources();
    const docs = await col.find({}).sort({ priority: -1, label: 1 }).toArray();
    return docs.map((d) => ({
      id: d._id.toHexString(),
      adapter: d.adapter,
      label: d.label,
      enabled: d.enabled,
      hasKey: Boolean(d.apiKeyEnc),
      baseUrl: d.baseUrl,
      competitions: d.competitions,
      rateLimitPerMin: d.rateLimitPerMin,
      priority: d.priority,
      lastRunAt: d.lastRunAt ? d.lastRunAt.toISOString() : null,
      lastStatus: d.lastStatus ?? null,
    }));
  });
}

export async function getFixtureSource(
  id: string,
): Promise<FixtureSourceLite | null> {
  const all = await getFixtureSources();
  return all.find((s) => s.id === id) ?? null;
}

export async function getLeagueChannelMaps(): Promise<LeagueChannelMapLite[]> {
  "use cache";
  cacheTag("league-maps");
  cacheLife("hours");
  return safeQuery([], async () => {
    const col = await leagueChannelMaps();
    const docs = await col.find({}).sort({ priority: -1 }).toArray();
    return docs.map((d) => ({
      id: d._id.toHexString(),
      match: d.match,
      channelIds: d.channelIds.map((c) => c.toHexString()),
      priority: d.priority,
      enabled: d.enabled,
    }));
  });
}

export async function getLeagueChannelMap(
  id: string,
): Promise<LeagueChannelMapLite | null> {
  const all = await getLeagueChannelMaps();
  return all.find((m) => m.id === id) ?? null;
}

function runToLite(d: SyncRunDoc): SyncRunLite {
  return {
    id: d._id.toHexString(),
    sourceId: d.sourceId ? d.sourceId.toHexString() : null,
    adapter: d.adapter,
    trigger: d.trigger,
    mode: d.mode,
    startedAt: d.startedAt.toISOString(),
    finishedAt: d.finishedAt ? d.finishedAt.toISOString() : null,
    status: d.status,
    counts: d.counts,
    errors: d.errors.map((e) => ({
      stage: e.stage,
      message: e.message,
      at: e.at.toISOString(),
    })),
  };
}

export async function getRecentSyncRuns(limit = 30): Promise<SyncRunLite[]> {
  "use cache";
  cacheTag("sync-runs");
  cacheLife("minutes");
  return safeQuery([], async () => {
    const col = await syncRuns();
    const docs = await col
      .find({})
      .sort({ startedAt: -1 })
      .limit(limit)
      .toArray();
    return docs.map(runToLite);
  });
}

export async function getSyncRun(id: string): Promise<SyncRunLite | null> {
  "use cache";
  cacheTag("sync-runs");
  cacheLife("minutes");
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(id)) return null;
  return safeQuery(null, async () => {
    const col = await syncRuns();
    const doc = await col.findOne({ _id: new ObjectId(id) });
    return doc ? runToLite(doc) : null;
  });
}
