import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { getDb } from "@/lib/db/client";
import { syncWorldCupFixtures } from "@/lib/worldcup/sync";

// Dynamic + Node by default under cacheComponents. Idempotent and fast: a fixed
// 104-fixture upsert, so no time-budget machinery is needed.
export const maxDuration = 60;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Hands-off World Cup fixture sync, called by cron-job.org (or any scheduler)
 * with `Authorization: Bearer <CRON_SECRET>`. Fails closed if the secret is unset.
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

  const db = await getDb();
  const result = await syncWorldCupFixtures(db);

  // Route Handlers must use revalidateTag (updateTag throws here).
  revalidateTag("events", "max");

  return Response.json({ ok: true, ...result });
}
