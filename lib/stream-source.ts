import "server-only";
import { ObjectId } from "mongodb";
import { channels } from "@/lib/db/collections";
import { decryptSecret } from "@/lib/crypto";

export interface DecryptedSource {
  url: string;
  referer?: string;
  userAgent?: string;
}

/**
 * Loads and decrypts a channel source. The ONLY reads of decrypted m3u8 URLs
 * outside the admin edit action happen here, inside the stream handlers.
 */
export async function getDecryptedSource(
  channelId: string,
  sourceIndex: number,
): Promise<DecryptedSource | null> {
  if (!ObjectId.isValid(channelId)) return null;
  const col = await channels();
  const channel = await col.findOne({
    _id: new ObjectId(channelId),
    isActive: true,
  });
  const source = channel?.sources?.[sourceIndex];
  if (!source || !source.active) return null;
  return {
    url: decryptSecret(source.urlEnc),
    referer: source.refererEnc ? decryptSecret(source.refererEnc) : undefined,
    userAgent: source.userAgentEnc
      ? decryptSecret(source.userAgentEnc)
      : undefined,
  };
}

export function originHeaders(source: DecryptedSource): HeadersInit {
  return {
    "User-Agent":
      source.userAgent ??
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    ...(source.referer ? { Referer: source.referer } : {}),
    Accept: "*/*",
  };
}
