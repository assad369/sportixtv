import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFixtureSources, getRecentSyncRuns } from "@/lib/data/fixtures";
import { settings } from "@/lib/db/collections";
import { DEFAULT_SETTINGS } from "@/lib/db/schemas/settings";
import { SyncNowButton } from "@/components/admin/SyncNowButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { registerCronJobs, unregisterCronJobs } from "@/lib/actions/cronjobs";

function statusVariant(status: string): "live" | "brand" | "default" {
  if (status === "error") return "live";
  if (status === "ok") return "brand";
  return "default";
}

export default async function AutopilotPage() {
  await requireSession();
  const col = await settings();
  const [sources, runs, settingsDoc] = await Promise.all([
    getFixtureSources(),
    getRecentSyncRuns(8),
    col.findOne({ _id: "site" }).then((d) => d ?? DEFAULT_SETTINGS),
  ]);
  const enabled = sources.filter((s) => s.enabled).length;
  const hasCronApiKey = Boolean(process.env.CRONJOB_API_KEY);
  const cronJobIds = settingsDoc.cronJobIds;

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

      {/* ── Scheduler (cron-job.org) ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">
          Scheduler (cron-job.org)
        </h2>
        <div className="rounded-xl border border-edge p-4">
          {!hasCronApiKey ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-amber-500">
                CRONJOB_API_KEY is not set — automatic schedule management is disabled.
              </p>
              <p className="text-ink-muted">
                Add <code className="rounded bg-surface px-1 py-0.5 font-mono text-xs">CRONJOB_API_KEY</code> to your environment
                (from{" "}
                <span className="font-mono text-xs">console.cron-job.org → Settings → API</span>)
                to register and manage schedules from here.
              </p>
              <p className="text-ink-muted">
                Until then, create two jobs manually in the cron-job.org console:
              </p>
              <ul className="ml-4 list-disc space-y-1 text-ink-muted">
                <li>
                  <span className="font-mono text-xs">
                    GET {process.env.NEXT_PUBLIC_SITE_URL}/api/cron/sync-fixtures
                  </span>{" "}
                  — every 6 h, header{" "}
                  <span className="font-mono text-xs">Authorization: Bearer &lt;CRON_SECRET&gt;</span>
                </li>
                <li>
                  <span className="font-mono text-xs">
                    GET {process.env.NEXT_PUBLIC_SITE_URL}/api/cron/worldcup
                  </span>{" "}
                  — daily, same header
                </li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-ink-muted">
                {cronJobIds?.syncFixtures || cronJobIds?.worldcup ? (
                  <p>
                    Registered jobs:{" "}
                    {cronJobIds.syncFixtures && (
                      <Badge variant="brand" className="mr-1">
                        sync-fixtures #{cronJobIds.syncFixtures}
                      </Badge>
                    )}
                    {cronJobIds.worldcup && (
                      <Badge variant="brand">
                        worldcup #{cronJobIds.worldcup}
                      </Badge>
                    )}
                  </p>
                ) : (
                  <p>No jobs registered yet. Use the form below to create them.</p>
                )}
              </div>

              <form action={registerCronJobs} className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium">
                    Fixtures sync interval (hours)
                  </label>
                  <input
                    type="number"
                    name="fixturesIntervalHours"
                    defaultValue={6}
                    min={1}
                    max={24}
                    className="w-24 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm"
                  />
                </div>
                <Button type="submit" size="sm">
                  {cronJobIds?.syncFixtures || cronJobIds?.worldcup
                    ? "Update schedules"
                    : "Register schedules"}
                </Button>
              </form>

              {(cronJobIds?.syncFixtures || cronJobIds?.worldcup) && (
                <form action={unregisterCronJobs}>
                  <Button type="submit" variant="secondary" size="sm">
                    Unregister schedules
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
