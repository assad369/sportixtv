"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getDb } from "@/lib/db/client";
import { requireSession } from "@/lib/auth/session";
import { syncWorldCupFixtures } from "@/lib/worldcup/sync";

/** Admin-triggered "Sync World Cup fixtures" button. */
export async function syncWorldCup(): Promise<void> {
  await requireSession();
  const db = await getDb();
  await syncWorldCupFixtures(db);
  updateTag("events");
  revalidatePath("/admin/settings");
}
