import { z } from "zod";
import { ObjectId } from "mongodb";
import { channels } from "@/lib/db/collections";
import {
  clientBindingFromRequest,
  issueInitialToken,
} from "@/lib/stream-token";
import { decryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  channelId: z.string().min(1),
  sourceIndex: z.number().int().min(0).max(20),
});

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`stream-token:${ip}`, { capacity: 30, refillPerMin: 15 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!ObjectId.isValid(body.channelId)) {
    return Response.json({ error: "Invalid channel" }, { status: 400 });
  }
  const col = await channels();
  const channel = await col.findOne(
    { _id: new ObjectId(body.channelId), isActive: true },
    { projection: { "sources.type": 1, "sources.active": 1, "sources.iframeCodeEnc": 1 } },
  );
  const source = channel?.sources?.[body.sourceIndex];
  if (!source || !source.active) {
    return Response.json({ error: "Source not available" }, { status: 404 });
  }

  // Iframe sources return the decrypted HTML code directly — no HLS token flow.
  if (source.type === "iframe") {
    if (!source.iframeCodeEnc) {
      return Response.json({ error: "Source not available" }, { status: 404 });
    }
    const iframeCode = decryptSecret(source.iframeCodeEnc);
    return Response.json(
      { type: "iframe", code: iframeCode },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const binding = clientBindingFromRequest(request);
  const token = issueInitialToken(body.channelId, body.sourceIndex, binding);
  return Response.json(
    { type: "hls", url: `/api/stream/play?t=${encodeURIComponent(token)}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
