import type { ObjectId } from "mongodb";

export interface NoticeDoc {
  _id: ObjectId;
  text: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
}
