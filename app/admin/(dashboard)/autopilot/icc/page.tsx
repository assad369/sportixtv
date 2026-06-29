import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { channels, settings, fixtureSources } from "@/lib/db/collections";
import { DEFAULT_SETTINGS } from "@/lib/db/schemas/settings";
import { getRecentSyncRuns } from "@/lib/data/fixtures";
import { getIccFixtureCounts } from "@/lib/data/icc";
import { ICC_SOURCE } from "@/lib/sync/adapters/icc";
import { saveIccSettings, setupIccSource, triggerIccSyncNow } from "@/lib/actions/icc";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default async function IccAutopilotPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
    setup?: string;
    synced?: string;
    error?: string;
    created?: string;
    updated?: string;
  }>;
}) {
  await requireSession();

  const [params, settingsDoc, allChannels, runs, counts] = await Promise.all([
    searchParams,
    settings()
      .then((col) => col.findOne({ _id: "site" }))
      .then((d) => d ?? DEFAULT_SETTINGS),
    channels()
      .then((col) =>
        col.find({}, { projection: { name: 1, logoUrl: 1 } }).sort({ name: 1 }).toArray(),
      ),
    getRecentSyncRuns(10),
    getIccFixtureCounts(),
  ]);

  // Find the ICC source so we can show its ID and status.
  const sourcesCol = await fixtureSources();
  const iccSource = await sourcesCol.findOne({ adapter: ICC_SOURCE });

  const iccSourceId = settingsDoc.iccFixtureSourceId ?? iccSource?._id.toHexString() ?? "";
  const iccRuns = runs.filter((r) => r.adapter === ICC_SOURCE || r.sourceId === iccSourceId);

  const menIds = new Set(settingsDoc.iccMenDefaultChannelIds ?? []);
  const womenIds = new Set(settingsDoc.iccWomenDefaultChannelIds ?? []);

  function statusVariant(status: string): "live" | "brand" | "default" {
    if (status === "error") return "live";
    if (status === "ok") return "brand";
    return "default";
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/autopilot"
              className="text-sm text-ink-muted hover:text-brand"
            >
              ← Autopilot
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold">ICC Cricket</h1>
          <p className="text-sm text-ink-muted">
            Automatically sync ICC Men's &amp; Women's fixtures from icc-cricket.com
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/icc/fixtures"
            target="_blank"
            className="rounded-lg border border-edge px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            View public page ↗
          </Link>
          <Link
            href="/admin/autopilot/mappings/new"
            className="rounded-lg border border-edge px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Add channel mapping
          </Link>
        </div>
      </div>

      {/* Flash messages */}
      {params.saved && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          ICC settings saved successfully.
        </div>
      )}
      {params.setup && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          ICC fixture source created. Now configure default channels below and run a sync.
        </div>
      )}
      {params.synced &&
        (Number(params.created) > 0 || Number(params.updated) > 0) && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            Sync complete — {params.created ?? 0} new, {params.updated ?? 0} updated.
          </div>
        )}
      {params.synced &&
        Number(params.created) === 0 &&
        Number(params.updated) === 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Sync ran but found no fixtures.{" "}
            {iccRuns[0]?.errors.length
              ? "See error details below."
              : "Check the sync run for details."}
            {iccRuns[0] && (
              <Link
                href={`/admin/autopilot/runs/${iccRuns[0].id}`}
                className="ml-2 underline hover:no-underline"
              >
                View run →
              </Link>
            )}
          </div>
        )}
      {params.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {params.error}
        </div>
      )}

      {/* ── Last sync error (shown whenever the most recent ICC run has errors) ── */}
      {iccRuns[0]?.errors?.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
          <h2 className="mb-2 text-sm font-semibold text-red-400">
            Last sync error — action required
          </h2>
          {iccRuns[0].errors.map((e, i) => (
            <p key={i} className="mt-1 text-sm text-ink-muted">
              <span className="font-mono text-xs text-red-400">[{e.stage}]</span>{" "}
              {e.message}
            </p>
          ))}
          <Link
            href={`/admin/autopilot/runs/${iccRuns[0].id}`}
            className="mt-3 inline-block text-xs text-brand hover:underline"
          >
            Full run details →
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Men's fixtures", value: counts.men },
          { label: "Women's fixtures", value: counts.women },
          { label: "Total (90-day window)", value: counts.total },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-edge bg-surface p-4">
            <p className="text-xs text-ink-muted">{label}</p>
            <p className="mt-1 text-2xl font-black">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Source quick-setup ── */}
      {!iccSource && (
        <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h2 className="text-base font-semibold text-amber-400">Quick Setup — Create ICC Source</h2>
          <p className="mt-1 text-sm text-ink-muted">
            No ICC fixture source exists yet. Click below to create one with the ICC website URL
            pre-filled. The adapter will try multiple strategies to extract fixture data.
          </p>
          <p className="mt-2 text-xs text-ink-faint">
            Tip: If the default URL stops working, inspect the ICC website network requests in
            DevTools and update the Base URL to the discovered JSON API endpoint under{" "}
            <Link
              href="/admin/autopilot/sources"
              className="text-brand hover:underline"
            >
              Autopilot → Sources
            </Link>
            .
          </p>
          <form action={setupIccSource} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium">
                Base URL (ICC fixtures page or discovered JSON API)
              </label>
              <input
                type="url"
                name="baseUrl"
                defaultValue="https://www.icc-cricket.com/fixtures-results"
                className="w-96 rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm"
              />
            </div>
            <Button type="submit" size="sm">
              Create ICC Source
            </Button>
          </form>
        </section>
      )}

      {iccSource && (
        <section className="rounded-xl border border-edge p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">ICC Fixture Source</h2>
              <p className="text-xs text-ink-muted">
                Adapter: {iccSource.adapter} · Base URL: {iccSource.baseUrl ?? "default"} ·{" "}
                {iccSource.competitions.length} competition(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={iccSource.enabled ? "brand" : "default"}>
                {iccSource.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Link
                href={`/admin/autopilot/sources/${iccSource._id.toHexString()}`}
                className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium hover:bg-surface-2"
              >
                Edit source
              </Link>
              <form action={triggerIccSyncNow}>
                <Button type="submit" size="sm" variant="secondary">
                  Sync now
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ── Default channel settings ── */}
      <section>
        <h2 className="mb-1 text-base font-semibold">Default Channels</h2>
        <p className="mb-4 text-sm text-ink-muted">
          New ICC events will automatically be assigned to these channels on sync. An admin
          can always override channels on individual events (they get locked against future
          syncs). Use{" "}
          <Link href="/admin/autopilot/mappings" className="text-brand hover:underline">
            League Channel Mappings
          </Link>{" "}
          for finer-grained per-tournament control.
        </p>

        <form action={saveIccSettings} className="flex flex-col gap-6">
          {/* Source ID (hidden) */}
          {iccSourceId && (
            <input type="hidden" name="iccFixtureSourceId" value={iccSourceId} />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Men's channels */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Men's ICC Events — Default Channels
              </h3>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-edge bg-surface p-1">
                {allChannels.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-ink-faint">
                    No channels yet.{" "}
                    <Link href="/admin/channels/new" className="text-brand hover:underline">
                      Create one
                    </Link>
                    .
                  </p>
                ) : (
                  allChannels.map((ch) => {
                    const id = ch._id.toHexString();
                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          name="iccMenDefaultChannelIds"
                          value={id}
                          defaultChecked={menIds.has(id)}
                          className="accent-brand"
                        />
                        <span className="text-sm">{ch.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Women's channels */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                Women's ICC Events — Default Channels
              </h3>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-edge bg-surface p-1">
                {allChannels.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-ink-faint">No channels yet.</p>
                ) : (
                  allChannels.map((ch) => {
                    const id = ch._id.toHexString();
                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-2"
                      >
                        <input
                          type="checkbox"
                          name="iccWomenDefaultChannelIds"
                          value={id}
                          defaultChecked={womenIds.has(id)}
                          className="accent-brand"
                        />
                        <span className="text-sm">{ch.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="relinkChannels"
                className="accent-brand"
              />
              Re-link all existing ICC events to these defaults (skips admin-locked events)
            </label>
          </div>

          <div>
            <Button type="submit">Save ICC settings</Button>
          </div>
        </form>
      </section>

      {/* ── Scheduler reminder ── */}
      <section className="rounded-xl border border-edge bg-surface p-5">
        <h2 className="mb-2 text-base font-semibold">Cron Schedule</h2>
        <p className="text-sm text-ink-muted">
          The ICC sync cron job interval is configured in the main{" "}
          <Link href="/admin/autopilot" className="text-brand hover:underline">
            Autopilot scheduler
          </Link>{" "}
          (default: every 6 hours). The endpoint is{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">
            GET /api/cron/icc
          </code>{" "}
          with the same{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-xs">
            Authorization: Bearer &lt;CRON_SECRET&gt;
          </code>{" "}
          header.
        </p>
      </section>

      {/* ── Recent sync runs ── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">
          Recent ICC Sync Runs
        </h2>
        <div className="overflow-x-auto rounded-xl border border-edge">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Started</th>
                <th className="px-4 py-2.5 font-medium">Trigger</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {iccRuns.map((r) => (
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
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    +{r.counts.created} new · {r.counts.updated} upd ·{" "}
                    {r.counts.skipped} skip · {r.counts.failed} fail
                  </td>
                </tr>
              ))}
              {iccRuns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-faint">
                    No ICC sync runs yet. Run a sync to see results here.
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
