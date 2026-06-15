import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { getSyncRun } from "@/lib/data/fixtures";
import { Badge } from "@/components/ui/Badge";

function statusVariant(status: string): "live" | "brand" | "default" {
  if (status === "error") return "live";
  if (status === "ok") return "brand";
  return "default";
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const run = await getSyncRun(id);
  if (!run) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/autopilot/runs"
          className="text-sm text-brand hover:underline"
        >
          ← Run history
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold">
          Sync run
          <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
        </h1>
        <p className="text-sm text-ink-muted">
          {run.adapter} · {run.trigger} · {run.mode} ·{" "}
          {new Date(run.startedAt).toLocaleString()}
          {run.finishedAt
            ? ` → ${new Date(run.finishedAt).toLocaleTimeString()}`
            : " (running)"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Created", run.counts.created],
            ["Updated", run.counts.updated],
            ["Skipped", run.counts.skipped],
            ["Failed", run.counts.failed],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-edge p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-ink-muted">{label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">
          Errors ({run.errors.length})
        </h2>
        {run.errors.length === 0 ? (
          <p className="text-sm text-ink-faint">No errors recorded.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {run.errors.map((e, i) => (
              <li
                key={i}
                className="rounded-lg border border-edge bg-surface p-3 text-sm"
              >
                <span className="font-medium text-live">{e.stage}</span>{" "}
                <span className="text-ink-faint">
                  {new Date(e.at).toLocaleTimeString()}
                </span>
                <p className="text-ink-muted">{e.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
