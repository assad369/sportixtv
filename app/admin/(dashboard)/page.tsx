import Link from "next/link";
import {
  channels,
  categories,
  events,
  reports,
} from "@/lib/db/collections";
import { requireSession } from "@/lib/auth/session";
import { formatViews } from "@/lib/utils";

async function getStats() {
  const [chCol, catCol, evCol, repCol] = await Promise.all([
    channels(),
    categories(),
    events(),
    reports(),
  ]);
  const [channelCount, categoryCount, eventCount, openReports, topChannels] =
    await Promise.all([
      chCol.countDocuments(),
      catCol.countDocuments(),
      evCol.countDocuments(),
      repCol.countDocuments({ resolved: false }),
      chCol
        .find({}, { projection: { name: 1, slug: 1, viewCount: 1 } })
        .sort({ viewCount: -1 })
        .limit(5)
        .toArray(),
    ]);
  return { channelCount, categoryCount, eventCount, openReports, topChannels };
}

export default async function AdminDashboardPage() {
  // Marks the page request-time (cookies) and re-verifies auth per page.
  await requireSession();
  const stats = await getStats();
  const cards = [
    { label: "Channels", value: stats.channelCount, href: "/admin/channels" },
    {
      label: "Categories",
      value: stats.categoryCount,
      href: "/admin/categories",
    },
    { label: "Events", value: stats.eventCount, href: "/admin/events" },
    {
      label: "Open Reports",
      value: stats.openReports,
      href: "/admin/reports",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-edge bg-surface p-5 transition-colors hover:border-brand/50"
          >
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-ink-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Top Channels by Views</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-edge">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-medium">Channel</th>
                <th className="px-4 py-2.5 font-medium">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {stats.topChannels.map((ch) => (
                <tr key={ch._id.toHexString()}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/admin/channels/${ch._id.toHexString()}`}
                      className="hover:text-brand"
                    >
                      {ch.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-muted">
                    {formatViews(ch.viewCount ?? 0)}
                  </td>
                </tr>
              ))}
              {stats.topChannels.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-ink-faint">
                    No channels yet.
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
