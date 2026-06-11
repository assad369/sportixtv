import { getAdsByPlacement } from "@/lib/data/ads";
import type { AdPlacement } from "@/lib/db/schemas/ad-spot";
import { AdRenderer } from "./AdRenderer";

const LAZY_PLACEMENTS: AdPlacement[] = ["sidebar", "between_grid", "footer"];

/** Server component: collapses to nothing when the placement has no ads. */
export async function AdSlot({
  placement,
  className,
}: {
  placement: AdPlacement;
  className?: string;
}) {
  const ads = await getAdsByPlacement(placement);
  if (ads.length === 0) return null;
  const lazy = LAZY_PLACEMENTS.includes(placement);

  return (
    <div className={className} data-ad-slot={placement}>
      {ads.map((ad) => (
        <AdRenderer key={ad.id} ad={ad} lazy={lazy} />
      ))}
    </div>
  );
}
