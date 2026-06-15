import Link from "next/link";
import { getRecentAndUpcomingEvents } from "@/lib/data/events";
import { LiveNowStripClient } from "./LiveNowStripClient";
import { ChevronRightIcon } from "@/components/icons";

export async function LiveNowStrip() {
  const events = await getRecentAndUpcomingEvents();
  if (events.length === 0) return null;

  return (
    <section aria-label="Live and upcoming events">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-live opacity-60 animate-ping" />
            <span className="relative inline-flex size-3 rounded-full bg-live" />
          </span>
          <h2 className="text-lg font-black tracking-tight">
            Live &amp; Upcoming Matches
          </h2>
        </div>
        <Link
          href="/events"
          aria-label="View all live sports events"
          className="flex items-center gap-1 rounded-xl border border-white/5 px-3 py-1.5 text-xs font-semibold text-ink-muted transition-all hover:border-brand/30 hover:text-brand"
        >
          All events <ChevronRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <LiveNowStripClient events={events} />
    </section>
  );
}
