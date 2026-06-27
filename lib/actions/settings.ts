"use server";

import { ObjectId } from "mongodb";
import { updateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { settings } from "@/lib/db/collections";
import { getDb } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { relinkWorldCupDefaultChannel } from "@/lib/worldcup/sync";

const urlOrEmpty = z.string().url().max(500).optional().or(z.literal(""));

const settingsSchema = z.object({
  siteName: z.string().min(1).max(80),
  tagline: z.string().max(200).default(""),
  logoUrl: urlOrEmpty,
  faviconUrl: urlOrEmpty,
  seoTitle: z.string().min(1).max(120),
  seoDescription: z.string().min(1).max(300),
  seoKeywords: z.string().max(500).default(""),
  facebook: urlOrEmpty,
  telegram: urlOrEmpty,
  twitter: urlOrEmpty,
  youtube: urlOrEmpty,
  adsenseClientId: z.string().max(50).optional().or(z.literal("")),
  adsenseEnabled: z.boolean(),
  tickerEnabled: z.boolean(),
  popunderEnabled: z.boolean(),
  worldCupDefaultChannelId: z
    .string()
    .max(48)
    .refine((v) => v === "" || ObjectId.isValid(v), "Invalid channel")
    .optional()
    .or(z.literal("")),
});

export async function updateSettings(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = settingsSchema.parse({
    siteName: formData.get("siteName"),
    tagline: formData.get("tagline") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    faviconUrl: formData.get("faviconUrl") ?? "",
    seoTitle: formData.get("seoTitle"),
    seoDescription: formData.get("seoDescription"),
    seoKeywords: formData.get("seoKeywords") ?? "",
    facebook: formData.get("facebook") ?? "",
    telegram: formData.get("telegram") ?? "",
    twitter: formData.get("twitter") ?? "",
    youtube: formData.get("youtube") ?? "",
    adsenseClientId: formData.get("adsenseClientId") ?? "",
    adsenseEnabled: formData.get("adsenseEnabled") === "on",
    tickerEnabled: formData.get("tickerEnabled") === "on",
    popunderEnabled: formData.get("popunderEnabled") === "on",
    worldCupDefaultChannelId: formData.get("worldCupDefaultChannelId") ?? "",
  });

  const worldCupDefaultChannelId = parsed.worldCupDefaultChannelId || undefined;

  const col = await settings();
  await col.updateOne(
    { _id: "site" },
    {
      $set: {
        siteName: parsed.siteName,
        tagline: parsed.tagline,
        logoUrl: parsed.logoUrl || undefined,
        faviconUrl: parsed.faviconUrl || undefined,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        seoKeywords: parsed.seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        socialLinks: {
          facebook: parsed.facebook || undefined,
          telegram: parsed.telegram || undefined,
          twitter: parsed.twitter || undefined,
          youtube: parsed.youtube || undefined,
        },
        adsenseClientId: parsed.adsenseClientId || undefined,
        adsenseEnabled: parsed.adsenseEnabled,
        tickerEnabled: parsed.tickerEnabled,
        popunderEnabled: parsed.popunderEnabled,
        worldCupDefaultChannelId,
      },
    },
    { upsert: true },
  );

  // Re-link World Cup fixtures to the (possibly changed) default channel.
  const db = await getDb();
  await relinkWorldCupDefaultChannel(db, worldCupDefaultChannelId ?? null);

  updateTag("settings");
  updateTag("events");
  revalidatePath("/admin/settings");
}
