import type { ObjectId } from "mongodb";

/**
 * Maps a synced fixture onto one or more broadcast channels. Channels stay
 * untouched (no league field on ChannelDoc); the mapping lives here so one
 * league can fan out to several channels and admins manage rules independently.
 *
 * Match precedence at assignment time (lib/sync/assign): providerLeagueId+source
 * → league (case-insensitive) → sport fallback. Higher `priority` wins/orders.
 */
export interface LeagueChannelMapDoc {
  _id: ObjectId;
  match: {
    sport?: string;
    league?: string;
    providerLeagueId?: string;
    source?: string;
  };
  channelIds: ObjectId[];
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
