import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { runSync } from "@/lib/sync/engine";
import type { SyncMode } from "@/lib/sync/types";

// Route handlers are dynamic + Node by default under cacheComponents (segment
// `dynamic`/`runtime` configs are disallowed there). The engine self-bounds its
// work under maxDuration via a time budget + paginated adapters.
export const maxDuration = 60;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Scheduled fixture sync, called by cron-job.org (or any scheduler) with
 * `Authorization: Bearer <CRON_SECRET>`. Fails closed if the secret is unset.
 * Use `?mode=live` for the frequent near-live status pass.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json(
      { error: "CRON_SECRET not configured" },
      { status: 401 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!safeEqual(provided, secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mode: SyncMode =
    new URL(request.url).searchParams.get("mode") === "live"
      ? "live"
      : "fixtures";

  const result = await runSync({ mode, trigger: "cron", timeBudgetMs: 45000 });

  // Route Handlers must use revalidateTag (updateTag throws here).
  revalidateTag("events", "max");
  revalidateTag("sync-runs", "max");
  revalidateTag("fixture-sources", "max");

  return Response.json({
    ok: result.status !== "error",
    mode,
    ...result,
  });
}
