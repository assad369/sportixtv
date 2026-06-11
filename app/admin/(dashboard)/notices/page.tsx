import { notices } from "@/lib/db/collections";
import { upsertNotice, deleteNotice } from "@/lib/actions/notices";
import { requireSession } from "@/lib/auth/session";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default async function AdminNoticesPage() {
  await requireSession();
  const col = await notices();
  const all = await col.find({}).sort({ order: 1 }).toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">Notices (ticker)</h1>

      <div className="mt-6 max-w-2xl rounded-xl border border-edge bg-surface p-4">
        <h2 className="font-semibold">Add notice</h2>
        <form action={upsertNotice} className="mt-3 flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs text-ink-muted">Text *</label>
            <Input name="text" required />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48">
              <label className="mb-1 block text-xs text-ink-muted">
                Link URL (optional)
              </label>
              <Input name="linkUrl" type="url" />
            </div>
            <div className="w-20">
              <label className="mb-1 block text-xs text-ink-muted">Order</label>
              <Input name="order" type="number" min={0} defaultValue={0} />
            </div>
            <label className="flex h-10 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked
                className="size-4 accent-[var(--color-brand)]"
              />
              Active
            </label>
            <Button type="submit">Add</Button>
          </div>
        </form>
      </div>

      <div className="mt-6 flex max-w-2xl flex-col gap-3">
        {all.map((n) => {
          const id = n._id.toHexString();
          return (
            <div key={id} className="rounded-xl border border-edge bg-surface p-4">
              <form action={upsertNotice} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={id} />
                <Input name="text" defaultValue={n.text} required />
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex-1 min-w-48">
                    <Input
                      name="linkUrl"
                      type="url"
                      defaultValue={n.linkUrl ?? ""}
                      placeholder="Link URL"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      name="order"
                      type="number"
                      min={0}
                      defaultValue={n.order}
                    />
                  </div>
                  <label className="flex h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={n.isActive}
                      className="size-4 accent-[var(--color-brand)]"
                    />
                    Active
                  </label>
                  <Button type="submit" variant="secondary">
                    Save
                  </Button>
                </div>
              </form>
              <form action={deleteNotice} className="mt-2">
                <input type="hidden" name="id" value={id} />
                <button className="text-xs text-live hover:underline">
                  Delete notice
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
