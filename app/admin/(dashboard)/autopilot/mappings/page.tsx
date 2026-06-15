import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { channels } from "@/lib/db/collections";
import { getLeagueChannelMaps } from "@/lib/data/fixtures";
import { deleteLeagueChannelMap } from "@/lib/actions/fixtures";
import { Badge } from "@/components/ui/Badge";

export default async function MappingsPage() {
  await requireSession();
  const maps = await getLeagueChannelMaps();

  const chCol = await channels();
  const chDocs = await chCol
    .find({}, { projection: { name: 1 } })
    .toArray();
  const names = new Map(chDocs.map((c) => [c._id.toHexString(), c.name]));

  function describe(m: (typeof maps)[number]): string {
    const parts: string[] = [];
    if (m.match.providerLeagueId)
      parts.push(`league#${m.match.providerLeagueId}`);
    if (m.match.source) parts.push(`@${m.match.source}`);
    if (m.match.league) parts.push(m.match.league);
    if (m.match.sport) parts.push(m.match.sport);
    return parts.join(" · ") || "—";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">League → Channel mappings</h1>
        <Link
          href="/admin/autopilot/mappings/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + New mapping
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Match</th>
              <th className="px-4 py-2.5 font-medium">Channels</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Enabled</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {maps.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2.5 font-medium">{describe(m)}</td>
                <td className="px-4 py-2.5 text-ink-muted">
                  {m.channelIds.map((id) => names.get(id) ?? id).join(", ") ||
                    "—"}
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{m.priority}</td>
                <td className="px-4 py-2.5">
                  {m.enabled ? (
                    <Badge variant="brand">On</Badge>
                  ) : (
                    <Badge>Off</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/autopilot/mappings/${m.id}`}
                      className="text-brand hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={deleteLeagueChannelMap}>
                      <input type="hidden" name="id" value={m.id} />
                      <button className="text-live hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {maps.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No mappings yet. Fixtures without a mapping are still created,
                  just without channels.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
