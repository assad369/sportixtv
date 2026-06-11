import Link from "next/link";
import { reports, channels } from "@/lib/db/collections";
import { resolveReport, deleteResolvedReports } from "@/lib/actions/reports";
import { requireSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function AdminReportsPage() {
  await requireSession();
  const [repCol, chCol] = await Promise.all([reports(), channels()]);
  const all = await repCol
    .find({})
    .sort({ resolved: 1, createdAt: -1 })
    .limit(200)
    .toArray();
  const chDocs = await chCol
    .find(
      { _id: { $in: all.map((r) => r.channelId) } },
      { projection: { name: 1, slug: 1 } },
    )
    .toArray();
  const chById = new Map(chDocs.map((c) => [c._id.toHexString(), c]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Broken Stream Reports</h1>
        <form action={deleteResolvedReports}>
          <Button variant="secondary" size="sm" type="submit">
            Clear resolved
          </Button>
        </form>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Channel</th>
              <th className="px-4 py-2.5 font-medium">Message</th>
              <th className="px-4 py-2.5 font-medium">When</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {all.map((r) => {
              const ch = chById.get(r.channelId.toHexString());
              return (
                <tr key={r._id.toHexString()}>
                  <td className="px-4 py-2.5">
                    {ch ? (
                      <Link
                        href={`/admin/channels/${r.channelId.toHexString()}`}
                        className="text-brand hover:underline"
                      >
                        {ch.name}
                      </Link>
                    ) : (
                      <span className="text-ink-faint">Deleted channel</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {r.message ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {r.createdAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {r.resolved ? (
                      <Badge variant="brand">Resolved</Badge>
                    ) : (
                      <Badge variant="live">Open</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {!r.resolved && (
                      <form action={resolveReport}>
                        <input
                          type="hidden"
                          name="id"
                          value={r._id.toHexString()}
                        />
                        <button className="text-brand hover:underline">
                          Mark resolved
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {all.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No reports — all streams healthy.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
