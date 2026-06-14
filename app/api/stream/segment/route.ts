import {
  clientBindingFromRequest,
  verifyToken,
} from "@/lib/stream-token";
import { getDecryptedSource, originHeaders } from "@/lib/stream-source";
import { rateLimit } from "@/lib/rate-limit";

function forbidden(reason: string) {
  return Response.json({ error: reason }, { status: 403 });
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // High limit: live streams request many segments per minute.
  if (!rateLimit(`stream-seg:${ip}`, { capacity: 600, refillPerMin: 300 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("t");
  const segUrl = searchParams.get("url");

  if (!token || !segUrl) return forbidden("Missing parameters");

  // Segment proxy only works with session tokens (payload.u is set).
  const binding = clientBindingFromRequest(request);
  const result = verifyToken(token, binding);
  if (!result.ok || !result.payload.u) return forbidden("Invalid or expired token");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(segUrl);
  } catch {
    return forbidden("Invalid segment URL");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return forbidden("Invalid segment URL");
  }

  const { payload } = result;
  const source = await getDecryptedSource(payload.c, payload.s);
  if (!source) return forbidden("Source not available");

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(segUrl, {
      headers: originHeaders(source),
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return Response.json({ error: "Upstream unreachable" }, { status: 502 });
  }

  if (!upstream.ok) {
    return Response.json({ error: "Upstream error" }, { status: 502 });
  }

  // Pass through the content-type from origin (video/mp2t, video/mp4, etc.)
  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
