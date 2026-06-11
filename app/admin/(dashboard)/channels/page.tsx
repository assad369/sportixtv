import Link from "next/link";
import Image from "next/image";
import { channels, categories } from "@/lib/db/collections";
import { deleteChannel } from "@/lib/actions/channels";
import { requireSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/Badge";
import { formatViews } from "@/lib/utils";

export default async function AdminChannelsPage() {
  await requireSession();
  const [chCol, catCol] = await Promise.all([channels(), categories()]);
  const [allChannels, allCategories] = await Promise.all([
    chCol.find({}).sort({ order: 1, name: 1 }).toArray(),
    catCol.find({}).toArray(),
  ]);
  const catName = new Map(
    allCategories.map((c) => [c._id.toHexString(), c.name]),
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Channels</h1>
        <Link
          href="/admin/channels/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + New channel
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Channel</th>
              <th className="px-4 py-2.5 font-medium">Category</th>
              <th className="px-4 py-2.5 font-medium">Sources</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Views</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {allChannels.map((ch) => {
              const id = ch._id.toHexString();
              return (
                <tr key={id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src={ch.logoUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 rounded bg-surface-2 object-cover"
                      />
                      <div>
                        <p className="font-medium">{ch.name}</p>
                        <p className="text-xs text-ink-faint">/{ch.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {catName.get(ch.categoryId?.toHexString()) ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {ch.sources?.length ?? 0}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      {ch.isActive ? (
                        <Badge variant="brand">Active</Badge>
                      ) : (
                        <Badge>Inactive</Badge>
                      )}
                      {ch.isFeatured && <Badge variant="outline">Featured</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {formatViews(ch.viewCount ?? 0)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/channels/${id}`}
                        className="text-brand hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteChannel}>
                        <input type="hidden" name="id" value={id} />
                        <button className="text-live hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {allChannels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                  No channels yet — create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
