import Link from "next/link";
import { getRecentAndUpcomingEvents } from "@/lib/data/events";
import { LiveNowStripClient } from "./LiveNowStripClient";
import { ChevronRightIcon } from "@/components/icons";

export async function LiveNowStrip() {
  const events = await getRecentAndUpcomingEvents();
  if (events.length === 0) return null;

  return (
    <section aria-label="Live and upcoming events">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">
          <span className="mr-2 inline-block size-2 rounded-full bg-live animate-pulse-live" />
          Live & Upcoming Matches
        </h2>
        <Link
          href="/events"
          className="flex items-center gap-0.5 text-sm text-brand hover:underline"
        >
          All events <ChevronRightIcon className="size-4" />
        </Link>
      </div>
      <LiveNowStripClient events={events} />
    </section>
  );
}
