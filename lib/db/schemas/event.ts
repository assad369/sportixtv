import type { ObjectId } from "mongodb";
import type { EventStatus } from "@/lib/utils";

export interface EventTeam {
  name: string;
  logoUrl?: string;
}

export interface EventDoc {
  _id: ObjectId;
  title: string;
  slug: string;
  sport: string;
  league?: string;
  teamA?: EventTeam;
  teamB?: EventTeam;
  startsAt: Date;
  endsAt?: Date | null;
  /** Admin override; when null/absent the status is derived from the clock. */
  forcedStatus?: EventStatus | null;
  channelIds: ObjectId[];
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
