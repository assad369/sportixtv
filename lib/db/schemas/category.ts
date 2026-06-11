import type { ObjectId } from "mongodb";

export interface CategoryDoc {
  _id: ObjectId;
  name: string;
  slug: string;
  /** Emoji or short icon token rendered in chips/cards. */
  icon: string;
  order: number;
  isActive: boolean;
}
