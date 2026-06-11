import "server-only";

/**
 * In-memory token-bucket rate limiter. Best-effort on serverless (state
 * resets per lambda instance) — good enough as an abuse speed bump; swap for
 * Upstash Redis if real abuse shows up.
 */
const buckets = new Map<string, { tokens: number; last: number }>();

const MAX_BUCKETS = 10_000;

export function rateLimit(
  key: string,
  { capacity = 20, refillPerMin = 10 }: { capacity?: number; refillPerMin?: number } = {},
): boolean {
  const now = Date.now();
  if (buckets.size > MAX_BUCKETS) buckets.clear();
  const bucket = buckets.get(key) ?? { tokens: capacity, last: now };
  bucket.tokens = Math.min(
    capacity,
    bucket.tokens + ((now - bucket.last) / 60_000) * refillPerMin,
  );
  bucket.last = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}
