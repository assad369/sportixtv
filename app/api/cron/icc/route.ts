import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { getDb } from "@/lib/db/client";
import { settings } from "@/lib/db/collections";
import { runSync } from "@/lib/sync/engine";
import { applyIccDefaultChannels } from "@/lib/icc/sync";

export const maxDuration = 60;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * ICC Cricket fixture sync. Called by cron-job.org with
 * `Authorization: Bearer <CRON_SECRET>`. Fails closed when the secret is unset.
 *
 * Flow:
 *   1. Run the generic sync engine scoped to the ICC fixture source.
 *   2. Apply gender-based default channels to newly created events.
 *   3. Invalidate "events" cache so the public page refreshes.
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

  // Load the ICC source ID from settings.
  const col = await settings();
  const doc = await col.findOne({ _id: "site" });
  const iccSourceId = doc?.iccFixtureSourceId;

  if (!iccSourceId) {
    return Response.json(
      {
        ok: false,
        error:
          "ICC fixture source not configured. Go to Admin → Autopilot → ICC to set it up.",
      },
      { status: 422 },
    );
  }

  const result = await runSync({
    sourceId: iccSourceId,
    mode: "fixtures",
    trigger: "cron",
    timeBudgetMs: 45_000,
  });

  // Apply gender-based default channels to events created this run.
  const db = await getDb();
  const channelsLinked = await applyIccDefaultChannels(db);

  revalidateTag("events", "max");
  revalidateTag("sync-runs", "max");
  revalidateTag("fixture-sources", "max");

  return Response.json({
    ok: result.status !== "error",
    ...result,
    channelsLinked,
  });
}
