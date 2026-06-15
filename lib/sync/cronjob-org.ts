import "server-only";

/**
 * Thin client for the cron-job.org REST API (https://api.cron-job.org).
 * Lets the platform manage its own schedules programmatically instead of
 * configuring them by hand. Optional — the cron route works with any scheduler.
 *
 * Auth: Bearer <cron-job.org account API key>. The job it creates calls our
 * /api/cron/sync-fixtures route and forwards `Authorization: Bearer CRON_SECRET`
 * so our route can authenticate the caller.
 */

const API_BASE = "https://api.cron-job.org";

/** -1 in any array means "every" (every hour, every minute, …). */
export interface CronJobSchedule {
  timezone: string;
  hours: number[];
  minutes: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
}

export interface UpsertJobInput {
  apiKey: string;
  url: string;
  title?: string;
  enabled?: boolean;
  /** 0 = GET, 1 = POST, … (cron-job.org request method codes). */
  requestMethod?: number;
  headers?: Record<string, string>;
  schedule: CronJobSchedule;
}

function jobBody(input: UpsertJobInput) {
  return {
    job: {
      url: input.url,
      enabled: input.enabled ?? true,
      title: input.title,
      requestMethod: input.requestMethod ?? 0,
      schedule: input.schedule,
      extendedData: input.headers ? { headers: input.headers } : undefined,
    },
  };
}

async function call(
  apiKey: string,
  path: string,
  init: RequestInit,
): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`cron-job.org ${init.method ?? "GET"} ${path} → ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

/** Create a job. Returns the new jobId. */
export async function createCronJob(input: UpsertJobInput): Promise<number> {
  const data = (await call(input.apiKey, "/jobs", {
    method: "PUT",
    body: JSON.stringify(jobBody(input)),
  })) as { jobId: number };
  return data.jobId;
}

export async function updateCronJob(
  jobId: number,
  input: UpsertJobInput,
): Promise<void> {
  await call(input.apiKey, `/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify(jobBody(input)),
  });
}

export async function deleteCronJob(
  apiKey: string,
  jobId: number,
): Promise<void> {
  await call(apiKey, `/jobs/${jobId}`, { method: "DELETE" });
}

export async function listCronJobs(apiKey: string): Promise<unknown> {
  return call(apiKey, "/jobs", { method: "GET" });
}

const EVERY = -1;

/** Run at minute 0 of every Nth hour (e.g. every 6h → hours [0,6,12,18]). */
export function everyNHours(n: number, timezone = "UTC"): CronJobSchedule {
  const hours: number[] = [];
  for (let h = 0; h < 24; h += Math.max(1, n)) hours.push(h);
  return {
    timezone,
    hours,
    minutes: [0],
    mdays: [EVERY],
    months: [EVERY],
    wdays: [EVERY],
  };
}

/** Run every N minutes of every hour (e.g. every 5m → minutes [0,5,…,55]). */
export function everyNMinutes(n: number, timezone = "UTC"): CronJobSchedule {
  const minutes: number[] = [];
  for (let m = 0; m < 60; m += Math.max(1, n)) minutes.push(m);
  return {
    timezone,
    hours: [EVERY],
    minutes,
    mdays: [EVERY],
    months: [EVERY],
    wdays: [EVERY],
  };
}
