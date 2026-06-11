import {
  clientBindingFromRequest,
  issueSessionToken,
  verifyToken,
} from "@/lib/stream-token";
import { getDecryptedSource, originHeaders } from "@/lib/stream-source";
import {
  isMasterPlaylist,
  rewriteMasterPlaylist,
  rewriteMediaPlaylist,
  syntheticMaster,
} from "@/lib/hls-manifest";
import { rateLimit } from "@/lib/rate-limit";

const M3U8_HEADERS = {
  "Content-Type": "application/vnd.apple.mpegurl",
  "Cache-Control": "no-store",
};

function forbidden(reason: string) {
  return Response.json({ error: reason }, { status: 403 });
}

export async function GET(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  // Generous: hls.js refreshes live media playlists every few seconds.
  if (!rateLimit(`stream-play:${ip}`, { capacity: 120, refillPerMin: 60 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = new URL(request.url).searchParams.get("t");
  if (!token) return forbidden("Missing token");

  const binding = clientBindingFromRequest(request);
  const result = verifyToken(token, binding);
  if (!result.ok) return forbidden("Invalid or expired token");

  const { payload, targetUrl } = result;
  const source = await getDecryptedSource(payload.c, payload.s);
  if (!source) return forbidden("Source not available");

  // Session tokens carry their own (encrypted) playlist URL; initial tokens
  // resolve to the channel's configured source URL.
  const playlistUrl = targetUrl ?? source.url;

  let upstream: globalThis.Response;
  try {
    upstream = await fetch(playlistUrl, {
      headers: originHeaders(source),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return Response.json({ error: "Upstream unreachable" }, { status: 502 });
  }
  if (!upstream.ok) {
    return Response.json({ error: "Upstream error" }, { status: 502 });
  }

  const text = await upstream.text();
  if (!text.trimStart().startsWith("#EXTM3U")) {
    return Response.json({ error: "Invalid upstream playlist" }, { status: 502 });
  }
  // Redirects are common with IPTV origins — resolve URIs against the final URL.
  const baseUrl = upstream.url || playlistUrl;

  const toSessionUrl = (absUrl: string) =>
    `/api/stream/play?t=${encodeURIComponent(
      issueSessionToken(payload.c, payload.s, absUrl, binding),
    )}`;

  if (isMasterPlaylist(text)) {
    return new Response(rewriteMasterPlaylist(text, baseUrl, toSessionUrl), {
      headers: M3U8_HEADERS,
    });
  }

  // Media playlist reached with an initial (short-lived) token: hls.js will
  // re-request this exact URL for the whole session, so hand back a synthetic
  // master pointing at a long-lived session-token URL instead.
  if (!payload.u) {
    return new Response(syntheticMaster(toSessionUrl(baseUrl)), {
      headers: M3U8_HEADERS,
    });
  }

  return new Response(rewriteMediaPlaylist(text, baseUrl), {
    headers: M3U8_HEADERS,
  });
}
