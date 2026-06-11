import "server-only";
import type { Collection } from "mongodb";
import { getDb } from "./client";
import type { ChannelDoc } from "./schemas/channel";
import type { CategoryDoc } from "./schemas/category";
import type { EventDoc } from "./schemas/event";
import type { AdSpotDoc } from "./schemas/ad-spot";
import type { SiteSettings } from "./schemas/settings";
import type { NoticeDoc } from "./schemas/notice";
import type { AdminUserDoc } from "./schemas/admin-user";
import type { ReportDoc, ViewEventDoc } from "./schemas/report";

export async function channels(): Promise<Collection<ChannelDoc>> {
  return (await getDb()).collection<ChannelDoc>("channels");
}
export async function categories(): Promise<Collection<CategoryDoc>> {
  return (await getDb()).collection<CategoryDoc>("categories");
}
export async function events(): Promise<Collection<EventDoc>> {
  return (await getDb()).collection<EventDoc>("events");
}
export async function adSpots(): Promise<Collection<AdSpotDoc>> {
  return (await getDb()).collection<AdSpotDoc>("adSpots");
}
export async function settings(): Promise<Collection<SiteSettings>> {
  return (await getDb()).collection<SiteSettings>("settings");
}
export async function notices(): Promise<Collection<NoticeDoc>> {
  return (await getDb()).collection<NoticeDoc>("notices");
}
export async function adminUsers(): Promise<Collection<AdminUserDoc>> {
  return (await getDb()).collection<AdminUserDoc>("adminUsers");
}
export async function reports(): Promise<Collection<ReportDoc>> {
  return (await getDb()).collection<ReportDoc>("reports");
}
export async function viewEvents(): Promise<Collection<ViewEventDoc>> {
  return (await getDb()).collection<ViewEventDoc>("viewEvents");
}
