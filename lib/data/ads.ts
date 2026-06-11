import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { adSpots } from "@/lib/db/collections";
import type { AdPlacement } from "@/lib/db/schemas/ad-spot";
import { safeQuery } from "./safe";

export interface AdSpotLite {
  id: string;
  placement: AdPlacement;
  type: "html" | "image";
  htmlCode?: string;
  imageUrl?: string;
  linkUrl?: string;
}

export async function getAdsByPlacement(
  placement: AdPlacement,
): Promise<AdSpotLite[]> {
  "use cache";
  cacheTag("ads");
  cacheLife("hours");
  return safeQuery([], async () => {
    const col = await adSpots();
    const docs = await col
      .find({ placement, isActive: true })
      .sort({ order: 1 })
      .toArray();
    return docs.map((a) => ({
      id: a._id.toHexString(),
      placement: a.placement,
      type: a.type,
      htmlCode: a.htmlCode,
      imageUrl: a.imageUrl,
      linkUrl: a.linkUrl,
    }));
  });
}
