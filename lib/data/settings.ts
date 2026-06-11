import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { settings } from "@/lib/db/collections";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/db/schemas/settings";
import { safeQuery } from "./safe";

export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("days");
  return safeQuery(DEFAULT_SETTINGS, async () => {
    const col = await settings();
    const doc = await col.findOne({ _id: "site" });
    return doc ? { ...DEFAULT_SETTINGS, ...doc } : DEFAULT_SETTINGS;
  });
}
