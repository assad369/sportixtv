import { ObjectId } from "mongodb";
import { channels, viewEvents } from "@/lib/db/collections";
import { rateLimit } from "@/lib/rate-limit";
import { todayKey } from "@/lib/utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "Invalid channel" }, { status: 400 });
  }
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // One view per channel per IP per ~minute.
  if (!rateLimit(`view:${ip}:${id}`, { capacity: 1, refillPerMin: 1 })) {
    return Response.json({ ok: true });
  }

  const channelId = new ObjectId(id);
  const chCol = await channels();
  const updated = await chCol.updateOne(
    { _id: channelId, isActive: true },
    { $inc: { viewCount: 1 } },
  );
  if (updated.matchedCount > 0) {
    const veCol = await viewEvents();
    await veCol.updateOne(
      { channelId, day: todayKey() },
      { $inc: { count: 1 } },
      { upsert: true },
    );
  }
  return Response.json({ ok: true });
}
