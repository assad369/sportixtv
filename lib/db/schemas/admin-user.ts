import type { ObjectId } from "mongodb";

export interface AdminUserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLoginAt?: Date;
}
