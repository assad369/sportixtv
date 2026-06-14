import type { ObjectId } from "mongodb";
import type { EncryptedBlob } from "@/lib/crypto";

export interface ChannelSource {
  /** "hls" for m3u8 streams (default), "iframe" for embedded player URLs. */
  type: "hls" | "iframe";
  label: string;
  /** AES-256-GCM encrypted m3u8 URL. Never sent to the client. HLS only. */
  urlEnc?: EncryptedBlob;
  /** Optional Referer header some IPTV origins require (encrypted). */
  refererEnc?: EncryptedBlob | null;
  /** Optional User-Agent some IPTV origins require (encrypted). */
  userAgentEnc?: EncryptedBlob | null;
  /** AES-256-GCM encrypted iframe embed URL. Never sent to the client. Iframe only. */
  iframeUrlEnc?: EncryptedBlob | null;
  order: number;
  active: boolean;
}

export interface ChannelDoc {
  _id: ObjectId;
  name: string;
  slug: string;
  logoUrl: string;
  categoryId: ObjectId;
  description: string;
  sources: ChannelSource[];
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  language?: string;
  country?: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Public projection — everything the client may see. NEVER include `sources`. */
export const CHANNEL_PUBLIC_PROJECTION = {
  name: 1,
  slug: 1,
  logoUrl: 1,
  categoryId: 1,
  description: 1,
  isActive: 1,
  isFeatured: 1,
  order: 1,
  language: 1,
  country: 1,
  viewCount: 1,
  updatedAt: 1,
  // Safe source metadata only (type/label/active), used for the source switcher UI.
  "sources.type": 1,
  "sources.label": 1,
  "sources.active": 1,
  "sources.order": 1,
} as const;
