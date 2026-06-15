import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFixtureSources } from "@/lib/data/fixtures";
import { deleteSource, toggleSource } from "@/lib/actions/fixtures";
import { Badge } from "@/components/ui/Badge";

export default async function SourcesPage() {
  await requireSession();
  const sources = await getFixtureSources();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sources</h1>
        <Link
          href="/admin/autopilot/sources/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + New source
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Label</th>
              <th className="px-4 py-2.5 font-medium">Adapter</th>
              <th className="px-4 py-2.5 font-medium">Key</th>
              <th className="px-4 py-2.5 font-medium">Enabled</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {sources.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2.5">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-ink-faint">
                    {s.competitions.length} competition(s) · priority{" "}
                    {s.priority}
                  </p>
                </td>
                <td className="px-4 py-2.5 text-ink-muted">{s.adapter}</td>
                <td className="px-4 py-2.5">
                  {s.hasKey ? <Badge variant="brand">Set</Badge> : <Badge>—</Badge>}
                </td>
                <td className="px-4 py-2.5">
                  {s.enabled ? (
                    <Badge variant="brand">On</Badge>
                  ) : (
                    <Badge>Off</Badge>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/autopilot/sources/${s.id}`}
                      className="text-brand hover:underline"
                    >
                      Edit
                    </Link>
                    <form action={toggleSource}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-ink-muted hover:underline">
                        {s.enabled ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={deleteSource}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="text-live hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {sources.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No sources yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
