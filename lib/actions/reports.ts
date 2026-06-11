"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { reports } from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";

export async function resolveReport(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!ObjectId.isValid(id)) throw new Error("Invalid id");
  const col = await reports();
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { resolved: true } },
  );
  revalidatePath("/admin/reports");
}

export async function deleteResolvedReports(): Promise<void> {
  await requireSession();
  const col = await reports();
  await col.deleteMany({ resolved: true });
  revalidatePath("/admin/reports");
}
