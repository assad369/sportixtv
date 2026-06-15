"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import {
  fixtureSources,
  leagueChannelMaps,
} from "@/lib/db/collections";
import type { SourceCompetition } from "@/lib/db/schemas/fixture-source";
import { encryptSecret } from "@/lib/crypto";
import { requireSession } from "@/lib/auth/session";
import { getAdapter } from "@/lib/sync/adapters";
import { runSync } from "@/lib/sync/engine";

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

const sourceSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  adapter: z.string().min(1).max(50),
  label: z.string().min(1).max(80),
  enabled: z.boolean(),
  apiKey: z.string().max(500).optional().or(z.literal("")),
  baseUrl: z.string().url().max(500).optional().or(z.literal("")),
  rateLimitPerMin: z.coerce.number().int().min(0).max(100000).optional(),
  priority: z.coerce.number().int().min(0).max(1000).default(0),
  competitions: z.string().max(8000).default(""),
});

/** Each non-empty line: `providerLeagueId | label | season(optional)`. */
function parseCompetitions(raw: string): SourceCompetition[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [providerLeagueId, label, season] = line
        .split("|")
        .map((p) => p.trim());
      return {
        providerLeagueId,
        label: label || providerLeagueId,
        season: season || undefined,
        enabled: true,
      };
    })
    .filter((c) => c.providerLeagueId);
}

export async function saveFixtureSource(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = sourceSchema.parse({
    id: formData.get("id") ?? "",
    adapter: formData.get("adapter"),
    label: formData.get("label"),
    enabled: formData.get("enabled") === "on",
    apiKey: formData.get("apiKey") ?? "",
    baseUrl: formData.get("baseUrl") ?? "",
    rateLimitPerMin: formData.get("rateLimitPerMin") || undefined,
    priority: formData.get("priority") ?? 0,
    competitions: formData.get("competitions") ?? "",
  });

  if (!getAdapter(parsed.adapter)) throw new Error("Unknown adapter");

  const now = new Date();
  const base = {
    adapter: parsed.adapter,
    label: parsed.label,
    enabled: parsed.enabled,
    baseUrl: parsed.baseUrl || undefined,
    rateLimitPerMin: parsed.rateLimitPerMin,
    priority: parsed.priority,
    competitions: parseCompetitions(parsed.competitions),
    updatedAt: now,
  };

  const col = await fixtureSources();
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    const set: Record<string, unknown> = { ...base };
    // Only replace the key when a new one was actually entered.
    if (parsed.apiKey) set.apiKeyEnc = encryptSecret(parsed.apiKey);
    await col.updateOne({ _id: new ObjectId(parsed.id) }, { $set: set });
  } else {
    await col.insertOne({
      _id: new ObjectId(),
      ...base,
      apiKeyEnc: parsed.apiKey ? encryptSecret(parsed.apiKey) : null,
      lastRunAt: null,
      lastStatus: null,
      createdAt: now,
    });
  }

  updateTag("fixture-sources");
  redirect("/admin/autopilot/sources");
}

export async function deleteSource(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await fixtureSources();
  await col.deleteOne({ _id: new ObjectId(id) });
  updateTag("fixture-sources");
  redirect("/admin/autopilot/sources");
}

export async function toggleSource(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await fixtureSources();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      { $set: { enabled: !existing.enabled, updatedAt: new Date() } },
    );
    updateTag("fixture-sources");
  }
  redirect("/admin/autopilot/sources");
}

// ---------------------------------------------------------------------------
// League → channel mappings
// ---------------------------------------------------------------------------

const mapSchema = z
  .object({
    id: z.string().optional().or(z.literal("")),
    sport: z.string().max(50).optional().or(z.literal("")),
    league: z.string().max(120).optional().or(z.literal("")),
    providerLeagueId: z.string().max(120).optional().or(z.literal("")),
    source: z.string().max(50).optional().or(z.literal("")),
    channelIds: z.array(z.string().refine(ObjectId.isValid)).default([]),
    priority: z.coerce.number().int().min(0).max(1000).default(0),
    enabled: z.boolean(),
  })
  .refine((v) => v.sport || v.league || v.providerLeagueId, {
    message: "At least one of sport / league / providerLeagueId is required",
  })
  .refine((v) => v.channelIds.length > 0, {
    message: "Select at least one channel",
  });

export async function saveLeagueChannelMap(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = mapSchema.parse({
    id: formData.get("id") ?? "",
    sport: formData.get("sport") ?? "",
    league: formData.get("league") ?? "",
    providerLeagueId: formData.get("providerLeagueId") ?? "",
    source: formData.get("source") ?? "",
    channelIds: formData.getAll("channelIds").map(String),
    priority: formData.get("priority") ?? 0,
    enabled: formData.get("enabled") === "on",
  });

  const now = new Date();
  const doc = {
    match: {
      sport: parsed.sport || undefined,
      league: parsed.league || undefined,
      providerLeagueId: parsed.providerLeagueId || undefined,
      source: parsed.source || undefined,
    },
    channelIds: parsed.channelIds.map((id) => new ObjectId(id)),
    priority: parsed.priority,
    enabled: parsed.enabled,
    updatedAt: now,
  };

  const col = await leagueChannelMaps();
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    await col.updateOne({ _id: new ObjectId(parsed.id) }, { $set: doc });
  } else {
    await col.insertOne({ _id: new ObjectId(), ...doc, createdAt: now });
  }

  updateTag("league-maps");
  redirect("/admin/autopilot/mappings");
}

export async function deleteLeagueChannelMap(
  formData: FormData,
): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await leagueChannelMaps();
  await col.deleteOne({ _id: new ObjectId(id) });
  updateTag("league-maps");
  redirect("/admin/autopilot/mappings");
}

// ---------------------------------------------------------------------------
// Manual trigger
// ---------------------------------------------------------------------------

export async function triggerSyncNow(formData: FormData): Promise<void> {
  await requireSession();
  const sourceId = String(formData.get("sourceId") ?? "");
  await runSync({
    sourceId: sourceId && ObjectId.isValid(sourceId) ? sourceId : undefined,
    mode: "fixtures",
    trigger: "manual",
    timeBudgetMs: 25000,
  });
  // Read-your-own-writes: refresh the public events + admin run/source views.
  updateTag("events");
  updateTag("sync-runs");
  updateTag("fixture-sources");
  redirect("/admin/autopilot");
}
