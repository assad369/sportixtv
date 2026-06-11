import { ObjectId } from "mongodb";
import { z } from "zod";
import { reports } from "@/lib/db/collections";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  channelId: z.string().refine(ObjectId.isValid),
  sourceIndex: z.number().int().min(0).max(20).optional(),
  message: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`report:${ip}`, { capacity: 3, refillPerMin: 1 })) {
    return Response.json({ error: "Too many reports" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const col = await reports();
  await col.insertOne({
    _id: new ObjectId(),
    channelId: new ObjectId(body.channelId),
    sourceIndex: body.sourceIndex,
    message: body.message,
    ua: (request.headers.get("user-agent") ?? "").slice(0, 200),
    resolved: false,
    createdAt: new Date(),
  });
  return Response.json({ ok: true });
}
