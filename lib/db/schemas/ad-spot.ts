import type { ObjectId } from "mongodb";

export const AD_PLACEMENTS = [
  "header",
  "below_player",
  "sidebar",
  "between_grid",
  "footer",
  "popunder",
] as const;
export type AdPlacement = (typeof AD_PLACEMENTS)[number];

export interface AdSpotDoc {
  _id: ObjectId;
  name: string;
  placement: AdPlacement;
  type: "html" | "image";
  htmlCode?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
