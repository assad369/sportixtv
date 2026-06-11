import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { nanoid } from "nanoid";
import { encryptSecret, decryptSecret, type EncryptedBlob } from "./crypto";

/**
 * Playback token design:
 *
 * - The player first POSTs /api/stream/token and receives a short-lived
 *   "initial" token (60s) for a channel+source.
 * - /api/stream/play exchanges it for manifest text. Master-playlist variant
 *   URIs are rewritten to longer-lived "session" tokens (4h) because hls.js
 *   re-requests the *same* media-playlist URL for the whole live session.
 * - Session tokens carry the AES-encrypted absolute origin URL (`u`), so the
 *   token itself never reveals the origin even when base64-decoded.
 * - All tokens are HMAC-signed and bound to hashed IP + User-Agent.
 */
export interface StreamTokenPayload {
  /** channel id (hex) */
  c: string;
  /** source index */
  s: number;
  /** encrypted absolute playlist URL (session tokens only) */
  u?: EncryptedBlob;
  /** hashed client ip */
  ip: string;
  /** hashed client user-agent */
  ua: string;
  /** expiry, epoch seconds */
  exp: number;
  /** nonce */
  n: string;
}

const INITIAL_TTL_S = 60;
const SESSION_TTL_S = 4 * 60 * 60;

function secret(): string {
  const s = process.env.STREAM_TOKEN_SECRET;
  if (!s) throw new Error("STREAM_TOKEN_SECRET is not set");
  return s;
}

function hmac(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function hashClientBinding(value: string): string {
  return createHmac("sha256", secret())
    .update(value)
    .digest("base64url")
    .slice(0, 16);
}

export function clientBindingFromRequest(request: Request): {
  ip: string;
  ua: string;
} {
  const fwd = request.headers.get("x-forwarded-for") ?? "";
  const ip = fwd.split(",")[0]!.trim() || "local";
  const ua = (request.headers.get("user-agent") ?? "").slice(0, 64);
  return { ip: hashClientBinding(ip), ua: hashClientBinding(ua) };
}

function sign(payload: StreamTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

export function issueInitialToken(
  channelId: string,
  sourceIndex: number,
  binding: { ip: string; ua: string },
): string {
  return sign({
    c: channelId,
    s: sourceIndex,
    ...binding,
    exp: Math.floor(Date.now() / 1000) + INITIAL_TTL_S,
    n: nanoid(8),
  });
}

export function issueSessionToken(
  channelId: string,
  sourceIndex: number,
  absoluteUrl: string,
  binding: { ip: string; ua: string },
): string {
  return sign({
    c: channelId,
    s: sourceIndex,
    u: encryptSecret(absoluteUrl),
    ...binding,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
    n: nanoid(8),
  });
}

export type VerifyResult =
  | { ok: true; payload: StreamTokenPayload; targetUrl: string | null }
  | { ok: false; reason: "malformed" | "bad-signature" | "expired" | "binding-mismatch" };

export function verifyToken(
  token: string,
  binding: { ip: string; ua: string },
): VerifyResult {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return { ok: false, reason: "malformed" };
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return { ok: false, reason: "bad-signature" };
  }
  let payload: StreamTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, reason: "expired" };
  }
  if (payload.ip !== binding.ip || payload.ua !== binding.ua) {
    return { ok: false, reason: "binding-mismatch" };
  }
  const targetUrl = payload.u ? decryptSecret(payload.u) : null;
  return { ok: true, payload, targetUrl };
}
