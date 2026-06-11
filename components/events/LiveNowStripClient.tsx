"use client";

import { useEffect, useState } from "react";
import type { EventLite } from "@/lib/data/events";
import { deriveEventStatus } from "@/lib/utils";
import { EventCard } from "./EventCard";

/**
 * Filters to live + upcoming on the client so the cached server payload stays
 * clock-independent (ended events drop out without a server re-render).
 */
export function LiveNowStripClient({ events }: { events: EventLite[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const visible = events
    .filter((e) => deriveEventStatus(e, now) !== "ended")
    .slice(0, 12);
  if (visible.length === 0) return null;

  return (
    <div className="rail-scroll flex gap-3 overflow-x-auto pb-2">
      {visible.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}
