import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFixtureSources, getRecentSyncRuns } from "@/lib/data/fixtures";
import { SyncNowButton } from "@/components/admin/SyncNowButton";
import { Badge } from "@/components/ui/Badge";

function statusVariant(status: string): "live" | "brand" | "default" {
  if (status === "error") return "live";
  if (status === "ok") return "brand";
  return "default";
}

export default async function AutopilotPage() {
  await requireSession();
  const [sources, runs] = await Promise.all([
    getFixtureSources(),
    getRecentSyncRuns(8),
  ]);
  const enabled = sources.filter((s) => s.enabled).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Autopilot</h1>
          <p className="text-sm text-ink-muted">
            {sources.length} source(s), {enabled} enabled. Fixtures sync into
            Events automatically.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/autopilot/sources"
            className="rounded-lg border border-edge px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Sources
          </Link>
          <Link
            href="/admin/autopilot/mappings"
            className="rounded-lg border border-edge px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Mappings
          </Link>
          <Link
            href="/admin/autopilot/runs"
            className="rounded-lg border border-edge px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Run history
          </Link>
          {enabled > 0 && <SyncNowButton label="Sync all now" />}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Sources</h2>
        <div className="overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Adapter</th>
                <th className="px-4 py-2.5 font-medium">Enabled</th>
                <th className="px-4 py-2.5 font-medium">Last run</th>
                <th className="px-4 py-2.5 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {sources.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/autopilot/sources/${s.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {s.label}
                    </Link>
                    <p className="text-xs text-ink-faint">
                      {s.competitions.length} competition(s)
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{s.adapter}</td>
                  <td className="px-4 py-2.5">
                    {s.enabled ? (
                      <Badge variant="brand">On</Badge>
                    ) : (
                      <Badge>Off</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {s.lastRunAt ? (
                      <span className="flex items-center gap-2">
                        {s.lastStatus && (
                          <Badge variant={statusVariant(s.lastStatus)}>
                            {s.lastStatus}
                          </Badge>
                        )}
                        {new Date(s.lastRunAt).toLocaleString()}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <SyncNowButton sourceId={s.id} label="Sync" size="sm" />
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    No sources yet —{" "}
                    <Link
                      href="/admin/autopilot/sources/new"
                      className="text-brand hover:underline"
                    >
                      add one
                    </Link>
                    .
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">
          Recent runs
        </h2>
        <div className="overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Started</th>
                <th className="px-4 py-2.5 font-medium">Trigger</th>
                <th className="px-4 py-2.5 font-medium">Mode</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 text-ink-muted">
                    <Link
                      href={`/admin/autopilot/runs/${r.id}`}
                      className="text-brand hover:underline"
                    >
                      {new Date(r.startedAt).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">{r.trigger}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{r.mode}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    +{r.counts.created} new · {r.counts.updated} upd ·{" "}
                    {r.counts.skipped} skip · {r.counts.failed} fail
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-ink-faint"
                  >
                    No sync runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
