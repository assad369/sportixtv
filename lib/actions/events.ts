"use server";

import { ObjectId } from "mongodb";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { events } from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const eventSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  title: z.string().min(1).max(200),
  sport: z.string().min(1).max(50),
  league: z.string().max(120).optional().or(z.literal("")),
  teamAName: z.string().max(100).optional().or(z.literal("")),
  teamALogo: z.string().url().max(2000).optional().or(z.literal("")),
  teamBName: z.string().max(100).optional().or(z.literal("")),
  teamBLogo: z.string().url().max(2000).optional().or(z.literal("")),
  startsAt: z.string().min(1),
  endsAt: z.string().optional().or(z.literal("")),
  forcedStatus: z.enum(["", "upcoming", "live", "ended"]).default(""),
  channelIds: z.array(z.string().refine(ObjectId.isValid)).default([]),
  isFeatured: z.boolean(),
});

export async function upsertEvent(formData: FormData): Promise<void> {
  await requireSession();

  const parsed = eventSchema.parse({
    id: formData.get("id") ?? "",
    title: formData.get("title"),
    sport: formData.get("sport"),
    league: formData.get("league") ?? "",
    teamAName: formData.get("teamAName") ?? "",
    teamALogo: formData.get("teamALogo") ?? "",
    teamBName: formData.get("teamBName") ?? "",
    teamBLogo: formData.get("teamBLogo") ?? "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? "",
    forcedStatus: formData.get("forcedStatus") ?? "",
    channelIds: formData.getAll("channelIds").map(String),
    isFeatured: formData.get("isFeatured") === "on",
  });

  const startsAt = new Date(parsed.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("Invalid start time");
  const endsAt = parsed.endsAt ? new Date(parsed.endsAt) : null;

  const now = new Date();
  const doc = {
    title: parsed.title,
    sport: parsed.sport,
    league: parsed.league || undefined,
    teamA: parsed.teamAName
      ? { name: parsed.teamAName, logoUrl: parsed.teamALogo || undefined }
      : undefined,
    teamB: parsed.teamBName
      ? { name: parsed.teamBName, logoUrl: parsed.teamBLogo || undefined }
      : undefined,
    startsAt,
    endsAt,
    forcedStatus: parsed.forcedStatus || null,
    channelIds: parsed.channelIds.map((id) => new ObjectId(id)),
    isFeatured: parsed.isFeatured,
    updatedAt: now,
  };

  const col = await events();
  let slug: string;
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    const existing = await col.findOne({ _id: new ObjectId(parsed.id) });
    if (!existing) throw new Error("Event not found");
    slug = existing.slug;
    await col.updateOne({ _id: existing._id }, { $set: doc });
  } else {
    slug = slugify(parsed.title);
    if (!slug) throw new Error("Could not derive a slug");
    // Keep slugs unique without failing on repeat fixtures.
    if (await col.findOne({ slug })) {
      slug = `${slug}-${startsAt.toISOString().slice(0, 10)}`;
    }
    await col.insertOne({
      _id: new ObjectId(),
      ...doc,
      slug,
      createdAt: now,
    });
  }

  updateTag("events");
  updateTag(`event:${slug}`);
  redirect("/admin/events");
}

export async function deleteEvent(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await events();
  const existing = await col.findOne({ _id: new ObjectId(id) });
  if (existing) {
    await col.deleteOne({ _id: existing._id });
    updateTag("events");
    updateTag(`event:${existing.slug}`);
  }
  redirect("/admin/events");
}
