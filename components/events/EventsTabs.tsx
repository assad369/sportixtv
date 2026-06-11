"use client";

import { useEffect, useState } from "react";
import type { EventLite } from "@/lib/data/events";
import { deriveEventStatus, type EventStatus, cn } from "@/lib/utils";
import { EventCard } from "./EventCard";

const TABS: { key: EventStatus; label: string }[] = [
  { key: "live", label: "🔴 Live Now" },
  { key: "upcoming", label: "📅 Upcoming" },
  { key: "ended", label: "✔️ Ended" },
];

export function EventsTabs({ events }: { events: EventLite[] }) {
  const [tab, setTab] = useState<EventStatus>("live");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const grouped: Record<EventStatus, EventLite[]> = {
    live: [],
    upcoming: [],
    ended: [],
  };
  for (const e of events) grouped[deriveEventStatus(e, now)].push(e);
  grouped.upcoming.sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  grouped.ended.sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  // Default to upcoming when nothing is live (once, after first paint, to
  // keep server and hydration renders identical).
  const liveCount = grouped.live.length;
  const upcomingCount = grouped.upcoming.length;
  useEffect(() => {
    const t = setTimeout(() => {
      if (liveCount === 0 && upcomingCount > 0) {
        setTab((current) => (current === "live" ? "upcoming" : current));
      }
    }, 0);
    return () => clearTimeout(t);
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = grouped[tab];

  return (
    <div>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-brand bg-brand/15 text-brand"
                : "border-edge bg-surface text-ink-muted hover:border-brand/50",
            )}
          >
            {t.label} ({grouped[t.key].length})
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 [&>a]:w-full">
        {visible.map((e) => (
          <EventCard key={e.id} event={e} />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="py-16 text-center text-sm text-ink-faint">
          No {tab} events right now.
        </p>
      )}
    </div>
  );
}
