import { adSpots } from "@/lib/db/collections";
import { AD_PLACEMENTS } from "@/lib/db/schemas/ad-spot";
import { upsertAdSpot, deleteAdSpot } from "@/lib/actions/ads";
import { requireSession } from "@/lib/auth/session";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function AdFields({
  defaults,
}: {
  defaults?: {
    name?: string;
    placement?: string;
    type?: string;
    htmlCode?: string;
    imageUrl?: string;
    linkUrl?: string;
    order?: number;
    isActive?: boolean;
  };
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-ink-muted">Name *</label>
          <Input name="name" defaultValue={defaults?.name ?? ""} required />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">Placement *</label>
          <Select name="placement" defaultValue={defaults?.placement ?? "header"}>
            {AD_PLACEMENTS.map((p) => (
              <option key={p} value={p}>
                {p.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">Type *</label>
          <Select name="type" defaultValue={defaults?.type ?? "html"}>
            <option value="html">HTML / Script code</option>
            <option value="image">Image banner</option>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">Order</label>
          <Input
            name="order"
            type="number"
            min={0}
            defaultValue={defaults?.order ?? 0}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">
            Image URL (image type)
          </label>
          <Input name="imageUrl" type="url" defaultValue={defaults?.imageUrl ?? ""} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-muted">
            Link URL (image click / popunder target)
          </label>
          <Input name="linkUrl" type="url" defaultValue={defaults?.linkUrl ?? ""} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-ink-muted">
          HTML / Script code (html type)
        </label>
        <Textarea
          name="htmlCode"
          rows={4}
          defaultValue={defaults?.htmlCode ?? ""}
          placeholder='<script src="https://ad-network.example/tag.js"></script>'
          className="font-mono text-xs"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={defaults?.isActive ?? true}
          className="size-4 accent-[var(--color-brand)]"
        />
        Active
      </label>
    </>
  );
}

export default async function AdminAdsPage() {
  await requireSession();
  const col = await adSpots();
  const all = await col.find({}).sort({ placement: 1, order: 1 }).toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">Ad Spots</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Placements: header, below player, sidebar, between grid, footer,
        popunder (needs Link URL + the popunder toggle in Settings).
      </p>

      <div className="mt-6 max-w-3xl rounded-xl border border-edge bg-surface p-4">
        <h2 className="font-semibold">Add ad spot</h2>
        <form action={upsertAdSpot} className="mt-3 flex flex-col gap-3">
          <AdFields />
          <div>
            <Button type="submit">Add ad spot</Button>
          </div>
        </form>
      </div>

      <div className="mt-6 flex max-w-3xl flex-col gap-3">
        {all.map((ad) => {
          const id = ad._id.toHexString();
          return (
            <div key={id} className="rounded-xl border border-edge bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="brand">{ad.placement.replace("_", " ")}</Badge>
                <Badge variant="outline">{ad.type}</Badge>
                {!ad.isActive && <Badge>Inactive</Badge>}
              </div>
              <form action={upsertAdSpot} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={id} />
                <AdFields
                  defaults={{
                    name: ad.name,
                    placement: ad.placement,
                    type: ad.type,
                    htmlCode: ad.htmlCode,
                    imageUrl: ad.imageUrl,
                    linkUrl: ad.linkUrl,
                    order: ad.order,
                    isActive: ad.isActive,
                  }}
                />
                <div className="flex items-center gap-4">
                  <Button type="submit" variant="secondary">
                    Save
                  </Button>
                </div>
              </form>
              <form action={deleteAdSpot} className="mt-2">
                <input type="hidden" name="id" value={id} />
                <button className="text-xs text-live hover:underline">
                  Delete ad spot
                </button>
              </form>
            </div>
          );
        })}
        {all.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-faint">
            No ad spots yet.
          </p>
        )}
      </div>
    </div>
  );
}
