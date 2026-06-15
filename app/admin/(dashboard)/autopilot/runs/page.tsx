import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getRecentSyncRuns } from "@/lib/data/fixtures";
import { Badge } from "@/components/ui/Badge";

function statusVariant(status: string): "live" | "brand" | "default" {
  if (status === "error") return "live";
  if (status === "ok") return "brand";
  return "default";
}

export default async function RunsPage() {
  await requireSession();
  const runs = await getRecentSyncRuns(50);

  return (
    <div>
      <h1 className="text-2xl font-bold">Sync run history</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-surface text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Started</th>
              <th className="px-4 py-2.5 font-medium">Adapter</th>
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
                <td className="px-4 py-2.5 text-ink-muted">{r.adapter}</td>
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
                <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                  No sync runs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
