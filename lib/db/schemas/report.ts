import type { ObjectId } from "mongodb";

export interface ReportDoc {
  _id: ObjectId;
  channelId: ObjectId;
  sourceIndex?: number;
  message?: string;
  ua: string;
  resolved: boolean;
  createdAt: Date;
}

export interface ViewEventDoc {
  _id: ObjectId;
  channelId: ObjectId;
  /** YYYY-MM-DD */
  day: string;
  count: number;
}
