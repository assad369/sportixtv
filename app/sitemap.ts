import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/data/categories";
import { getAllActiveChannels } from "@/lib/data/channels";
import { getRecentAndUpcomingEvents } from "@/lib/data/events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const [categories, channels, events] = await Promise.all([
    getCategories(),
    getAllActiveChannels(),
    getRecentAndUpcomingEvents(),
  ]);

  return [
    { url, changeFrequency: "hourly", priority: 1, lastModified: now },
    {
      url: `${url}/categories`,
      changeFrequency: "weekly",
      priority: 0.7,
      lastModified: now,
    },
    {
      url: `${url}/events`,
      changeFrequency: "hourly",
      priority: 0.9,
      lastModified: now,
    },
    {
      url: `${url}/about`,
      changeFrequency: "monthly",
      priority: 0.4,
      lastModified: now,
    },
    {
      url: `${url}/contact`,
      changeFrequency: "monthly",
      priority: 0.3,
      lastModified: now,
    },
    {
      url: `${url}/privacy`,
      changeFrequency: "yearly",
      priority: 0.2,
      lastModified: now,
    },
    {
      url: `${url}/terms`,
      changeFrequency: "yearly",
      priority: 0.2,
      lastModified: now,
    },
    {
      url: `${url}/dmca`,
      changeFrequency: "monthly",
      priority: 0.2,
      lastModified: now,
    },
    ...categories.map((c) => ({
      url: `${url}/category/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
      lastModified: now,
    })),
    ...channels.map((c) => ({
      url: `${url}/channel/${c.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.9,
      lastModified: (c as { updatedAt?: Date }).updatedAt ?? now,
    })),
    ...events.map((e) => ({
      url: `${url}/event/${e.slug}`,
      changeFrequency: "hourly" as const,
      priority: 0.85,
      lastModified: now,
    })),
  ];
}
