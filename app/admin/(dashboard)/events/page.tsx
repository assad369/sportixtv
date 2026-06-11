import Link from "next/link";
import { events } from "@/lib/db/collections";
import { deleteEvent } from "@/lib/actions/events";
import { requireSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/Badge";

export default async function AdminEventsPage() {
  await requireSession();
  const col = await events();
  const all = await col.find({}).sort({ startsAt: -1 }).limit(200).toArray();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          + New event
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-edge">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-surface text-left text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Event</th>
              <th className="px-4 py-2.5 font-medium">Sport</th>
              <th className="px-4 py-2.5 font-medium">Starts</th>
              <th className="px-4 py-2.5 font-medium">Override</th>
              <th className="px-4 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {all.map((ev) => {
              const id = ev._id.toHexString();
              return (
                <tr key={id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium">{ev.title}</p>
                    <p className="text-xs text-ink-faint">
                      {ev.league ?? "—"} · {ev.channelIds.length} channel(s)
                    </p>
                  </td>
                  <td className="px-4 py-2.5 capitalize text-ink-muted">
                    {ev.sport}
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {ev.startsAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    {ev.forcedStatus ? (
                      <Badge variant="brand" className="capitalize">
                        {ev.forcedStatus}
                      </Badge>
                    ) : (
                      <Badge>Auto</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/events/${id}`}
                        className="text-brand hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteEvent}>
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
            {all.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
