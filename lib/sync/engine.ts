import "server-only";
import { ObjectId, type Collection } from "mongodb";
import {
  channels,
  events,
  fixtureSources,
  leagueChannelMaps,
  syncRuns,
} from "@/lib/db/collections";
import type { EventDoc } from "@/lib/db/schemas/event";
import type { FixtureSourceDoc } from "@/lib/db/schemas/fixture-source";
import type { LeagueChannelMapDoc } from "@/lib/db/schemas/league-channel-map";
import {
  MAX_RUN_ERRORS,
  type SyncRunCounts,
  type SyncRunDoc,
  type SyncRunError,
} from "@/lib/db/schemas/sync-run";
import { decryptSecret } from "@/lib/crypto";
import { slugify } from "@/lib/utils";
import { getAdapter } from "./adapters";
import { resolveChannelIds } from "./assign";
import { createFetchJson } from "./http";
import {
  buildSyncUpdate,
  externalRefOf,
  physicalKeyOf,
  type SyncCandidate,
} from "./transform";
import type { NormalizedFixture, SyncMode } from "./types";

export interface RunSyncOptions {
  /** Hex id; when set, run only this source (even if disabled). */
  sourceId?: string;
  mode: SyncMode;
  trigger: "cron" | "manual";
  timeBudgetMs: number;
}

export interface RunSyncResult {
  status: "ok" | "partial" | "error";
  counts: SyncRunCounts;
  sources: number;
}

const zeroCounts = (): SyncRunCounts => ({
  created: 0,
  updated: 0,
  skipped: 0,
  failed: 0,
});

function isDuplicateKey(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  );
}

async function loadChannelIdSet(): Promise<Set<string>> {
  const col = await channels();
  const docs = await col.find({}, { projection: { _id: 1 } }).toArray();
  return new Set(docs.map((d) => d._id.toHexString()));
}

async function loadMaps(): Promise<LeagueChannelMapDoc[]> {
  const col = await leagueChannelMaps();
  return col.find({ enabled: true }).sort({ priority: -1 }).toArray();
}

async function uniqueSlug(
  col: Collection<EventDoc>,
  title: string,
  startsAt: Date,
  externalId: string,
): Promise<string> {
  const base = slugify(title) || `event-${slugify(externalId)}`;
  if (!(await col.findOne({ slug: base }))) return base;
  const dated = `${base}-${startsAt.toISOString().slice(0, 10)}`;
  if (!(await col.findOne({ slug: dated }))) return dated;
  return `${dated}-${slugify(externalId)}`.slice(0, 140) || `${base}-${Date.now()}`;
}

interface SourceRunOutcome {
  status: "ok" | "partial" | "error";
  counts: SyncRunCounts;
}

async function runSource(
  source: FixtureSourceDoc,
  opts: RunSyncOptions,
  maps: LeagueChannelMapDoc[],
  channelSet: Set<string>,
): Promise<SourceRunOutcome> {
  const runCol = await syncRuns();
  const evCol = await events();
  const counts = zeroCounts();
  const errors: SyncRunError[] = [];
  const startedAt = new Date();
  const runId = new ObjectId();

  const pushError = (stage: string, message: string) => {
    if (errors.length < MAX_RUN_ERRORS) {
      errors.push({ stage, message, at: new Date() });
    }
  };

  await runCol.insertOne({
    _id: runId,
    sourceId: source._id,
    adapter: source.adapter,
    trigger: opts.trigger,
    mode: opts.mode,
    startedAt,
    finishedAt: null,
    status: "running",
    counts,
    errors,
    cursor: null,
  } satisfies SyncRunDoc);

  let status: SourceRunOutcome["status"] = "ok";
  const controller = new AbortController();
  const deadline = Date.now() + opts.timeBudgetMs;
  const timer = setTimeout(
    () => controller.abort(),
    Math.max(0, opts.timeBudgetMs),
  );

  try {
    const adapter = getAdapter(source.adapter);
    if (!adapter) throw new Error(`Unknown adapter: ${source.adapter}`);

    const fetchJson = createFetchJson({
      rateLimitPerMin: source.rateLimitPerMin ?? adapter.defaultRateLimitPerMin,
      signal: controller.signal,
    });

    const ctx = {
      apiKey: source.apiKeyEnc ? decryptSecret(source.apiKeyEnc) : undefined,
      baseUrl: source.baseUrl ?? adapter.defaultBaseUrl,
      competitions: source.competitions
        .filter((c) => c.enabled)
        .map((c) => ({ providerLeagueId: c.providerLeagueId, season: c.season })),
      signal: controller.signal,
      fetchJson,
    };

    for await (const page of adapter.fetchFixtures(ctx, opts.mode)) {
      for (const fixture of page) {
        try {
          await processFixture(evCol, fixture, maps, channelSet, counts);
        } catch (err) {
          counts.failed++;
          pushError("upsert", errorMessage(err));
        }
      }
      if (Date.now() > deadline) {
        status = "partial";
        break;
      }
    }
  } catch (err) {
    // Abort = we hit the time budget mid-fetch; otherwise a real failure.
    if (controller.signal.aborted) {
      status = "partial";
    } else {
      status = "error";
      pushError("fetch", errorMessage(err));
    }
  } finally {
    clearTimeout(timer);
  }

  if (status === "ok" && counts.failed > 0) status = "partial";

  const finishedAt = new Date();
  await runCol.updateOne(
    { _id: runId },
    { $set: { finishedAt, status, counts, errors } },
  );
  const srcCol = await fixtureSources();
  await srcCol.updateOne(
    { _id: source._id },
    { $set: { lastRunAt: finishedAt, lastStatus: status } },
  );

  return { status, counts };
}

async function processFixture(
  evCol: Collection<EventDoc>,
  fixture: NormalizedFixture,
  maps: LeagueChannelMapDoc[],
  channelSet: Set<string>,
  counts: SyncRunCounts,
): Promise<void> {
  const externalRef = externalRefOf(fixture.source, fixture.externalId);
  const physicalKey = fixture.physicalKey ?? physicalKeyOf(fixture);

  let existing = await evCol.findOne({ externalRef });
  if (!existing && physicalKey) {
    existing = await evCol.findOne({ physicalKey });
  }

  const candidate: SyncCandidate = {
    title: fixture.title,
    sport: fixture.sport,
    league: fixture.league,
    teamA: fixture.teamA,
    teamB: fixture.teamB,
    startsAt: fixture.startsAt,
    endsAt: fixture.endsAt ?? null,
    channelIds: resolveChannelIds(fixture, maps, channelSet),
    source: fixture.source,
    externalId: fixture.externalId,
    externalRef,
    externalUpdatedAt: fixture.externalUpdatedAt ?? null,
    physicalKey,
  };

  const plan = buildSyncUpdate(existing, candidate);

  if (plan.decision === "skip") {
    counts.skipped++;
    return;
  }
  if (plan.decision === "update") {
    await evCol.updateOne({ _id: existing!._id }, { $set: plan.set });
    counts.updated++;
    return;
  }

  // create — upsert keyed by externalRef so concurrent runs can't duplicate.
  const slug = await uniqueSlug(
    evCol,
    fixture.title,
    fixture.startsAt,
    fixture.externalId,
  );
  try {
    const res = await evCol.updateOne(
      { externalRef },
      {
        $set: plan.set,
        $setOnInsert: { ...plan.setOnInsert, _id: new ObjectId(), slug },
      },
      { upsert: true },
    );
    if (res.upsertedCount) counts.created++;
    else counts.updated++;
  } catch (err) {
    if (isDuplicateKey(err)) {
      await evCol.updateOne({ externalRef }, { $set: plan.set });
      counts.updated++;
    } else {
      throw err;
    }
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Run a sync across one or all enabled sources. Shared by the manual "Sync now"
 * server action and the cron route handler — behavior is identical; only cache
 * invalidation differs and is done by the CALLER (updateTag in actions,
 * revalidateTag in route handlers).
 */
export async function runSync(opts: RunSyncOptions): Promise<RunSyncResult> {
  if (!process.env.MONGODB_URI) {
    return { status: "error", counts: zeroCounts(), sources: 0 };
  }

  const srcCol = await fixtureSources();
  let sources: FixtureSourceDoc[];
  if (opts.sourceId && ObjectId.isValid(opts.sourceId)) {
    const one = await srcCol.findOne({ _id: new ObjectId(opts.sourceId) });
    sources = one ? [one] : [];
  } else {
    sources = await srcCol.find({ enabled: true }).toArray();
  }

  if (sources.length === 0) {
    return { status: "ok", counts: zeroCounts(), sources: 0 };
  }

  const [maps, channelSet] = await Promise.all([loadMaps(), loadChannelIdSet()]);

  const total = zeroCounts();
  let anyError = false;
  let anyPartial = false;

  // Split the time budget across sources so the whole run stays bounded; each
  // source is isolated so one provider failing never aborts the others.
  const perSourceBudget = Math.max(
    5000,
    Math.floor(opts.timeBudgetMs / sources.length),
  );

  for (const source of sources) {
    let outcome: SourceRunOutcome;
    try {
      outcome = await runSource(
        source,
        { ...opts, timeBudgetMs: perSourceBudget },
        maps,
        channelSet,
      );
    } catch {
      outcome = { status: "error", counts: zeroCounts() };
    }
    total.created += outcome.counts.created;
    total.updated += outcome.counts.updated;
    total.skipped += outcome.counts.skipped;
    total.failed += outcome.counts.failed;
    if (outcome.status === "error") anyError = true;
    if (outcome.status === "partial") anyPartial = true;
  }

  const status = anyError ? "error" : anyPartial ? "partial" : "ok";
  return { status, counts: total, sources: sources.length };
}
