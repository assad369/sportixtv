import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { notices } from "@/lib/db/collections";
import { safeQuery } from "./safe";

export interface NoticeLite {
  id: string;
  text: string;
  linkUrl?: string;
}

export async function getNotices(): Promise<NoticeLite[]> {
  "use cache";
  cacheTag("notices");
  cacheLife("hours");
  return safeQuery([], async () => {
    const col = await notices();
    const docs = await col
      .find({ isActive: true })
      .sort({ order: 1 })
      .limit(10)
      .toArray();
    return docs.map((n) => ({
      id: n._id.toHexString(),
      text: n.text,
      linkUrl: n.linkUrl,
    }));
  });
}
