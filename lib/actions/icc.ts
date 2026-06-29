"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { fixtureSources, settings } from "@/lib/db/collections";
import { getDb } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { relinkIccDefaultChannels } from "@/lib/icc/sync";
import { ICC_SOURCE } from "@/lib/sync/adapters/icc";
import { runSync } from "@/lib/sync/engine";

// ── Save ICC settings ────────────────────────────────────────────────────────

const iccSettingsSchema = z.object({
  iccFixtureSourceId: z
    .string()
    .max(100)
    .refine((v) => !v || ObjectId.isValid(v), "Invalid source ID")
    .optional()
    .or(z.literal("")),
  iccMenDefaultChannelIds: z.array(z.string().length(24)).default([]),
  iccWomenDefaultChannelIds: z.array(z.string().length(24)).default([]),
  relinkChannels: z.boolean().default(false),
});

/**
 * Persist ICC settings: default channels per gender and the fixture source ID.
 * Optionally re-links all existing ICC events to the new channel defaults.
 */
export async function saveIccSettings(formData: FormData): Promise<void> {
  await requireSession();

  const menIds = formData.getAll("iccMenDefaultChannelIds").map(String).filter(ObjectId.isValid);
  const womenIds = formData.getAll("iccWomenDefaultChannelIds").map(String).filter(ObjectId.isValid);
  const sourceId = String(formData.get("iccFixtureSourceId") ?? "").trim();
  const relink = formData.get("relinkChannels") === "on";

  const parsed = iccSettingsSchema.safeParse({
    iccFixtureSourceId: sourceId || undefined,
    iccMenDefaultChannelIds: menIds,
    iccWomenDefaultChannelIds: womenIds,
    relinkChannels: relink,
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/admin/autopilot/icc?error=${encodeURIComponent(msg)}`);
  }

  const { iccFixtureSourceId, iccMenDefaultChannelIds, iccWomenDefaultChannelIds, relinkChannels } =
    parsed.data;

  const setFields: Record<string, unknown> = {
    iccMenDefaultChannelIds,
    iccWomenDefaultChannelIds,
  };
  if (iccFixtureSourceId) {
    setFields.iccFixtureSourceId = iccFixtureSourceId;
  }

  const col = await settings();
  await col.updateOne({ _id: "site" }, { $set: setFields }, { upsert: true });

  updateTag("events");
  updateTag("fixture-sources");

  if (relinkChannels) {
    const db = await getDb();
    await relinkIccDefaultChannels(db);
  }

  redirect("/admin/autopilot/icc?saved=1");
}

// ── Quick setup: create the ICC fixture source ───────────────────────────────

/**
 * Create the ICC fixture source (if one doesn't already exist with adapter="icc")
 * and persist its ObjectId in settings.iccFixtureSourceId.
 * Redirects to /admin/autopilot/icc on success.
 */
export async function setupIccSource(formData: FormData): Promise<void> {
  await requireSession();

  const baseUrl =
    String(formData.get("baseUrl") ?? "").trim() ||
    "https://www.icc-cricket.com/fixtures-results";

  const col = await fixtureSources();
  const settingsCol = await settings();

  // Idempotent: check if an ICC source already exists.
  const existing = await col.findOne({ adapter: ICC_SOURCE });
  let sourceId: string;

  if (existing) {
    // Update base URL if changed.
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          baseUrl,
          enabled: true,
          updatedAt: new Date(),
        },
      },
    );
    sourceId = existing._id.toHexString();
  } else {
    const now = new Date();
    const id = new ObjectId();
    await col.insertOne({
      _id: id,
      adapter: ICC_SOURCE,
      label: "ICC Cricket",
      enabled: true,
      apiKeyEnc: null,
      baseUrl,
      priority: 10,
      competitions: [
        { providerLeagueId: "men:all", label: "Men's — All Formats", enabled: true },
        { providerLeagueId: "women:all", label: "Women's — All Formats", enabled: true },
      ],
      rateLimitPerMin: 10,
      lastRunAt: null,
      lastStatus: null,
      createdAt: now,
      updatedAt: now,
    });
    sourceId = id.toHexString();
  }

  await settingsCol.updateOne(
    { _id: "site" },
    { $set: { iccFixtureSourceId: sourceId } },
    { upsert: true },
  );

  updateTag("fixture-sources");
  redirect("/admin/autopilot/icc?setup=1");
}

// ── Manual trigger scoped to ICC ─────────────────────────────────────────────

export async function triggerIccSyncNow(_formData: FormData): Promise<void> {
  await requireSession();

  const col = await settings();
  const doc = await col.findOne({ _id: "site" });
  const iccSourceId = doc?.iccFixtureSourceId;

  if (!iccSourceId) {
    redirect("/admin/autopilot/icc?error=ICC+source+not+configured");
  }

  const result = await runSync({
    sourceId: iccSourceId,
    mode: "fixtures",
    trigger: "manual",
    timeBudgetMs: 25_000,
  });

  if (result.status !== "error") {
    const db = await getDb();
    await relinkIccDefaultChannels(db);
  }

  updateTag("events");
  updateTag("sync-runs");
  updateTag("fixture-sources");
  redirect(`/admin/autopilot/icc?synced=1&created=${result.counts.created}&updated=${result.counts.updated}`);
}
