"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { settings } from "@/lib/db/collections";
import {
  createCronJob,
  deleteCronJob,
  everyNHours,
  listCronJobs,
  updateCronJob,
} from "@/lib/sync/cronjob-org";

function apiKey(): string {
  const key = process.env.CRONJOB_API_KEY;
  if (!key) throw new Error("CRONJOB_API_KEY is not configured");
  return key;
}

function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!url) throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  return url.replace(/\/$/, "");
}

function authHeader(): Record<string, string> {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not configured");
  return { Authorization: `Bearer ${secret}` };
}

/**
 * Register (or update) both cron jobs on cron-job.org.
 * Persists the returned jobIds in the settings doc so re-runs use PATCH.
 * formData accepts `fixturesIntervalHours` (default 6).
 */
export async function registerCronJobs(formData: FormData): Promise<void> {
  await requireSession();
  let errorMsg: string | null = null;

  try {
    const key = apiKey();
    const base = siteUrl();
    const headers = authHeader();

    const intervalHours = Math.max(
      1,
      Math.min(24, Number(formData.get("fixturesIntervalHours") ?? 6) || 6),
    );

    const col = await settings();
    const doc = await col.findOne({ _id: "site" });
    const existing = doc?.cronJobIds ?? {};

    let syncFixturesJobId: number;
    const fixturesInput = {
      apiKey: key,
      url: `${base}/api/cron/sync-fixtures`,
      title: "SportixTV — sync-fixtures",
      enabled: true,
      headers,
      schedule: everyNHours(intervalHours),
    };
    if (existing.syncFixtures) {
      await updateCronJob(existing.syncFixtures, fixturesInput);
      syncFixturesJobId = existing.syncFixtures;
    } else {
      syncFixturesJobId = await createCronJob(fixturesInput);
    }

    let worldcupJobId: number;
    const worldcupInput = {
      apiKey: key,
      url: `${base}/api/cron/worldcup`,
      title: "SportixTV — worldcup-sync",
      enabled: true,
      headers,
      schedule: everyNHours(24),
    };
    if (existing.worldcup) {
      await updateCronJob(existing.worldcup, worldcupInput);
      worldcupJobId = existing.worldcup;
    } else {
      worldcupJobId = await createCronJob(worldcupInput);
    }

    await col.updateOne(
      { _id: "site" },
      { $set: { cronJobIds: { syncFixtures: syncFixturesJobId, worldcup: worldcupJobId } } },
      { upsert: true },
    );
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  if (errorMsg) {
    redirect(`/admin/autopilot?scheduler_error=${encodeURIComponent(errorMsg)}`);
  }
  redirect("/admin/autopilot");
}

/** Delete both registered jobs from cron-job.org and clear the stored jobIds. */
export async function unregisterCronJobs(_formData: FormData): Promise<void> {
  await requireSession();
  let errorMsg: string | null = null;

  try {
    const key = apiKey();
    const col = await settings();
    const doc = await col.findOne({ _id: "site" });
    const existing = doc?.cronJobIds ?? {};

    if (existing.syncFixtures) await deleteCronJob(key, existing.syncFixtures);
    if (existing.worldcup) await deleteCronJob(key, existing.worldcup);
    await col.updateOne({ _id: "site" }, { $unset: { cronJobIds: "" } });
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  if (errorMsg) {
    redirect(`/admin/autopilot?scheduler_error=${encodeURIComponent(errorMsg)}`);
  }
  redirect("/admin/autopilot");
}

export interface CronJobEntry {
  jobId: number;
  title: string;
  enabled: boolean;
  url: string;
  lastStatus: number;
  nextExecution: number | null;
}

export interface ListJobsResult {
  ok: boolean;
  error?: string;
  jobs?: CronJobEntry[];
}

/** Fetch the live job list from cron-job.org for display in the admin UI. */
export async function listRegisteredJobs(): Promise<ListJobsResult> {
  await requireSession();
  const key = apiKey();

  try {
    const data = (await listCronJobs(key)) as { jobs: CronJobEntry[] };
    return { ok: true, jobs: data.jobs ?? [] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
