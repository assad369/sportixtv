import "server-only";

export interface FetchJsonOptions {
  rateLimitPerMin?: number;
  retries?: number;
  signal: AbortSignal;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function backoff(attempt: number, signal: AbortSignal): Promise<void> {
  const base = Math.min(2 ** attempt * 250, 8000);
  const jitter = Math.random() * 250;
  return sleep(base + jitter, signal);
}

/** Strip query string so API keys are never surfaced in error messages. */
function safeUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return "<url>";
  }
}

/**
 * Build a JSON fetcher with per-source request spacing (token-bucket style),
 * exponential backoff + jitter on 429/5xx, Retry-After support, and a hard
 * AbortSignal so a slow provider can never exceed the run's time budget. The
 * API key (carried by the caller in headers/url) is never logged.
 */
export function createFetchJson(opts: FetchJsonOptions) {
  const { rateLimitPerMin = 60, retries = 3, signal } = opts;
  const minIntervalMs = rateLimitPerMin > 0 ? Math.ceil(60000 / rateLimitPerMin) : 0;
  let nextAllowed = 0;

  async function space(): Promise<void> {
    if (!minIntervalMs) return;
    const now = Date.now();
    const wait = nextAllowed - now;
    nextAllowed = Math.max(now, nextAllowed) + minIntervalMs;
    if (wait > 0) await sleep(wait, signal);
  }

  return async function fetchJson(
    url: string,
    init?: RequestInit,
  ): Promise<unknown> {
    let attempt = 0;
    for (;;) {
      await space();
      let res: Response;
      try {
        res = await fetch(url, { ...init, signal });
      } catch (err) {
        if (signal.aborted || attempt++ >= retries) throw err;
        await backoff(attempt, signal);
        continue;
      }

      if (res.status === 429 || res.status >= 500) {
        if (attempt++ >= retries) {
          throw new Error(`HTTP ${res.status} for ${safeUrl(url)}`);
        }
        const retryAfter = Number(res.headers.get("retry-after"));
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          await sleep(Math.min(retryAfter * 1000, 30000), signal);
        } else {
          await backoff(attempt, signal);
        }
        continue;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status} for ${safeUrl(url)}`);
      return res.json();
    }
  };
}
