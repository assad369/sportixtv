"use server";

import { ObjectId } from "mongodb";
import { updateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { categories } from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

const categorySchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(1).max(80),
  icon: z.string().max(20).default("📺"),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean(),
});

export async function upsertCategory(formData: FormData): Promise<void> {
  await requireSession();
  const parsed = categorySchema.parse({
    id: formData.get("id") ?? "",
    name: formData.get("name"),
    icon: formData.get("icon") || "📺",
    order: formData.get("order") ?? 0,
    isActive: formData.get("isActive") === "on",
  });

  const col = await categories();
  if (parsed.id && ObjectId.isValid(parsed.id)) {
    await col.updateOne(
      { _id: new ObjectId(parsed.id) },
      {
        $set: {
          name: parsed.name,
          icon: parsed.icon,
          order: parsed.order,
          isActive: parsed.isActive,
        },
      },
    );
  } else {
    const slug = slugify(parsed.name);
    if (!slug) throw new Error("Could not derive a slug");
    await col.insertOne({
      _id: new ObjectId(),
      name: parsed.name,
      slug,
      icon: parsed.icon,
      order: parsed.order,
      isActive: parsed.isActive,
    });
  }
  updateTag("categories");
  revalidatePath("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await categories();
  await col.deleteOne({ _id: new ObjectId(id) });
  updateTag("categories");
  updateTag("channels");
  revalidatePath("/admin/categories");
}
