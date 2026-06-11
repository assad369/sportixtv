"use server";

import { ObjectId } from "mongodb";
import { updateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { adSpots } from "@/lib/db/collections";
import { AD_PLACEMENTS } from "@/lib/db/schemas/ad-spot";
import { requireSession } from "@/lib/auth/session";

const adSchema = z
  .object({
    id: z.string().optional().or(z.literal("")),
    name: z.string().min(1).max(100),
    placement: z.enum(AD_PLACEMENTS),
    type: z.enum(["html", "image"]),
    htmlCode: z.string().max(20000).optional().or(z.literal("")),
    imageUrl: z.string().url().max(2000).optional().or(z.literal("")),
    linkUrl: z.string().url().max(2000).optional().or(z.literal("")),
    order: z.coerce.number().int().min(0).default(0),
    isActive: z.boolean(),
  })
  .refine((d) => (d.type === "html" ? !!d.htmlCode : !!d.imageUrl), {
    message: "HTML ads need code; image ads need an image URL",
  });

export async function upsertAdSpot(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = adSchema.parse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    placement: formData.get("placement"),
    type: formData.get("type"),
    htmlCode: formData.get("htmlCode") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    linkUrl: formData.get("linkUrl") ?? "",
    order: formData.get("order") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  const col = await adSpots();
  const now = new Date();
  const doc = {
    name: parsed.name,
    placement: parsed.placement,
    type: parsed.type,
    htmlCode: parsed.htmlCode || undefined,
    imageUrl: parsed.imageUrl || undefined,
    linkUrl: parsed.linkUrl || undefined,
    order: parsed.order,
    isActive: parsed.isActive,
    updatedAt: now,
  };
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    await col.updateOne({ _id: new ObjectId(parsed.id) }, { $set: doc });
  } else {
    await col.insertOne({ _id: new ObjectId(), ...doc, createdAt: now });
  }
  updateTag("ads");
  revalidatePath("/admin/ads");
}

export async function deleteAdSpot(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await adSpots();
  await col.deleteOne({ _id: new ObjectId(id) });
  updateTag("ads");
  revalidatePath("/admin/ads");
}
