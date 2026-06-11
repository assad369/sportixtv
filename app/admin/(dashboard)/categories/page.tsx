import { categories } from "@/lib/db/collections";
import { upsertCategory, deleteCategory } from "@/lib/actions/categories";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth/session";

export default async function AdminCategoriesPage() {
  await requireSession();
  const col = await categories();
  const all = await col.find({}).sort({ order: 1 }).toArray();

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>

      <div className="mt-6 max-w-2xl rounded-xl border border-edge bg-surface p-4">
        <h2 className="font-semibold">Add category</h2>
        <form action={upsertCategory} className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <label className="mb-1 block text-xs text-ink-muted">Name *</label>
            <Input name="name" required />
          </div>
          <div className="w-20">
            <label className="mb-1 block text-xs text-ink-muted">Icon</label>
            <Input name="icon" placeholder="📺" />
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
        </form>
      </div>

      <div className="mt-6 flex max-w-2xl flex-col gap-3">
        {all.map((c) => {
          const id = c._id.toHexString();
          return (
            <div
              key={id}
              className="rounded-xl border border-edge bg-surface p-4"
            >
              <form
                action={upsertCategory}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="id" value={id} />
                <div className="flex-1 min-w-40">
                  <label className="mb-1 block text-xs text-ink-muted">
                    Name (/{c.slug})
                  </label>
                  <Input name="name" defaultValue={c.name} required />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs text-ink-muted">Icon</label>
                  <Input name="icon" defaultValue={c.icon} />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs text-ink-muted">Order</label>
                  <Input
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={c.order}
                  />
                </div>
                <label className="flex h-10 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={c.isActive}
                    className="size-4 accent-[var(--color-brand)]"
                  />
                  Active
                </label>
                <Button type="submit" variant="secondary" size="md">
                  Save
                </Button>
              </form>
              <form action={deleteCategory} className="mt-2">
                <input type="hidden" name="id" value={id} />
                <button className="text-xs text-live hover:underline">
                  Delete category
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
