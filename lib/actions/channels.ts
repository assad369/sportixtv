"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { channels } from "@/lib/db/collections";
import type { ChannelSource } from "@/lib/db/schemas/channel";
import { encryptSecret } from "@/lib/crypto";
import { requireSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const sourceSchema = z.object({
  label: z.string().min(1).max(50),
  url: z.string().url().max(2000),
  referer: z.string().max(2000).optional().or(z.literal("")),
  userAgent: z.string().max(500).optional().or(z.literal("")),
  active: z.boolean(),
});

const channelSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(1).max(120),
  slug: z.string().max(140).optional().or(z.literal("")),
  logoUrl: z.string().url().max(2000),
  categoryId: z.string().refine(ObjectId.isValid, "Invalid category"),
  description: z.string().max(2000).default(""),
  language: z.string().max(50).optional().or(z.literal("")),
  country: z.string().max(50).optional().or(z.literal("")),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  order: z.coerce.number().int().min(0).default(0),
  sources: z.array(sourceSchema).min(1).max(20),
});

function revalidateChannels(...slugs: string[]) {
  updateTag("channels");
  updateTag("trending");
  for (const slug of slugs) if (slug) updateTag(`channel:${slug}`);
}

export async function upsertChannel(formData: FormData): Promise<void> {
  await requireSession();

  const parsed = channelSchema.parse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    slug: formData.get("slug") ?? "",
    logoUrl: formData.get("logoUrl"),
    categoryId: formData.get("categoryId"),
    description: formData.get("description") ?? "",
    language: formData.get("language") ?? "",
    country: formData.get("country") ?? "",
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    order: formData.get("order") ?? 0,
    sources: JSON.parse(String(formData.get("sources") ?? "[]")),
  });

  const slug = slugify(parsed.slug || parsed.name);
  if (!slug) throw new Error("Could not derive a slug");
  const now = new Date();

  const sources: ChannelSource[] = parsed.sources.map((s, i) => ({
    label: s.label,
    urlEnc: encryptSecret(s.url),
    refererEnc: s.referer ? encryptSecret(s.referer) : null,
    userAgentEnc: s.userAgent ? encryptSecret(s.userAgent) : null,
    order: i,
    active: s.active,
  }));

  const doc = {
    name: parsed.name,
    slug,
    logoUrl: parsed.logoUrl,
    categoryId: new ObjectId(parsed.categoryId),
    description: parsed.description,
    language: parsed.language || undefined,
    country: parsed.country || undefined,
    isActive: parsed.isActive,
    isFeatured: parsed.isFeatured,
    order: parsed.order,
    sources,
    updatedAt: now,
  };

  const col = await channels();
  let oldSlug = "";
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    const existing = await col.findOne({ _id: new ObjectId(parsed.id) });
    if (!existing) throw new Error("Channel not found");
    oldSlug = existing.slug;
    await col.updateOne({ _id: existing._id }, { $set: doc });
  } else {
    await col.insertOne({
      _id: new ObjectId(),
      ...doc,
      viewCount: 0,
      createdAt: now,
    });
  }

  revalidateChannels(slug, oldSlug);
  redirect("/admin/channels");
}

export async function deleteChannel(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await channels();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (existing) {
    await col.deleteOne({ _id: existing._id });
    revalidateChannels(existing.slug);
  }
  redirect("/admin/channels");
}
