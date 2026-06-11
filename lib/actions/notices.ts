"use server";

import { ObjectId } from "mongodb";
import { updateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { notices } from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";

const noticeSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  text: z.string().min(1).max(300),
  linkUrl: z.string().url().max(2000).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean(),
});

export async function upsertNotice(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = noticeSchema.parse({
    id: formData.get("id") ?? "",
    text: formData.get("text"),
    linkUrl: formData.get("linkUrl") ?? "",
    order: formData.get("order") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  const col = await notices();
  const doc = {
    text: parsed.text,
    linkUrl: parsed.linkUrl || undefined,
    order: parsed.order,
    isActive: parsed.isActive,
  };
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    await col.updateOne({ _id: new ObjectId(parsed.id) }, { $set: doc });
  } else {
    await col.insertOne({ _id: new ObjectId(), ...doc, createdAt: new Date() });
  }
  updateTag("notices");
  revalidatePath("/admin/notices");
}

export async function deleteNotice(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await notices();
  await col.deleteOne({ _id: new ObjectId(id) });
  updateTag("notices");
  revalidatePath("/admin/notices");
}
