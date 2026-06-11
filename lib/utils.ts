export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export type EventStatus = "upcoming" | "live" | "ended";

/** Derive event status from the clock unless the admin forced one. */
export function deriveEventStatus(
  e: {
    startsAt: Date | string;
    endsAt?: Date | string | null;
    forcedStatus?: EventStatus | null;
  },
  now = Date.now(),
): EventStatus {
  if (e.forcedStatus) return e.forcedStatus;
  const start = new Date(e.startsAt).getTime();
  // Default live window: 4h after start when no explicit end time.
  const end = e.endsAt
    ? new Date(e.endsAt).getTime()
    : start + 4 * 60 * 60 * 1000;
  if (now < start) return "upcoming";
  if (now < end) return "live";
  return "ended";
}
